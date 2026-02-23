import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

type PlanKey = "starter" | "growth" | "dominant";

const PLAN_CONFIG: Record<PlanKey, { monthlyCredits: number }> = {
  starter: { monthlyCredits: 10 },
  growth: { monthlyCredits: 25 },
  dominant: { monthlyCredits: 50 },
};

type StripeSubscriptionShape = {
  id: string;
  status: string;
  customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  current_period_start?: number;
  current_period_end?: number;
  items: { data: Array<{ price?: { id?: string } }> };
  metadata?: Record<string, string>;
};

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function planKeyFromPriceId(
  prices: Record<string, string>,
  priceId: string | undefined
): PlanKey | null {
  if (!priceId) return null;
  for (const [key, id] of Object.entries(prices)) {
    if (
      id === priceId &&
      (key === "starter" || key === "growth" || key === "dominant")
    ) {
      return key;
    }
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query parameter is required" },
        { status: 400 }
      );
    }

    // Get active price mappings
    const { data: priceRows } = await admin
      .from("stripe_prices")
      .select("key, price_id");

    const prices: Record<string, string> = {};
    for (const row of priceRows ?? []) {
      prices[row.key] = row.price_id;
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : null;

    // Reconcile billing from the checkout session so credits reflect immediately
    // even if webhook delivery is delayed
    if (session.status === "complete" && stripeCustomerId) {
      const { data: existingBilling } = await admin
        .from("billing")
        .select("*")
        .eq("user_auth_id", user.id)
        .single();

      // Safety check: ensure checkout customer matches current user
      if (
        existingBilling?.stripe_customer_id &&
        existingBilling.stripe_customer_id !== stripeCustomerId
      ) {
        return NextResponse.json(
          { error: "Checkout session customer does not match current user" },
          { status: 403 }
        );
      }

      const now = Date.now();

      if (
        session.mode === "subscription" &&
        typeof session.subscription === "string"
      ) {
        const subscription = (await stripe.subscriptions.retrieve(
          session.subscription
        )) as unknown as StripeSubscriptionShape;

        const planKey = planKeyFromPriceId(
          prices,
          subscription.items.data[0]?.price?.id
        );

        if (planKey) {
          const monthlyCreditLimit = PLAN_CONFIG[planKey].monthlyCredits;
          const status = subscription.status as string;

          const shouldResetMonthlyUsage =
            !!existingBilling &&
            !!subscription.current_period_start &&
            existingBilling.current_period_start !==
              subscription.current_period_start * 1000;

          const monthlyCreditsUsed = shouldResetMonthlyUsage
            ? 0
            : (existingBilling?.monthly_credits_used ?? 0);
          const addonCreditsBalance =
            existingBilling?.addon_credits_balance ?? 0;

          if (existingBilling) {
            await admin
              .from("billing")
              .update({
                stripe_customer_id: stripeCustomerId,
                stripe_subscription_id: subscription.id,
                plan_key: planKey,
                status,
                current_period_start: subscription.current_period_start
                  ? subscription.current_period_start * 1000
                  : null,
                current_period_end: subscription.current_period_end
                  ? subscription.current_period_end * 1000
                  : null,
                monthly_credit_limit: monthlyCreditLimit,
                monthly_credits_used: monthlyCreditsUsed,
                addon_credits_balance: addonCreditsBalance,
                updated_at: now,
              })
              .eq("id", existingBilling.id);

            if (shouldResetMonthlyUsage) {
              await admin.from("credit_ledger").insert({
                user_auth_id: user.id,
                billing_id: existingBilling.id,
                amount: 0,
                reason: "monthly_reset",
                source: "system",
                monthly_credits_used_after: 0,
                addon_credits_balance_after: addonCreditsBalance,
                created_at: now,
              });
            }
          } else {
            await admin.from("billing").insert({
              user_auth_id: user.id,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: subscription.id,
              plan_key: planKey,
              status,
              current_period_start: subscription.current_period_start
                ? subscription.current_period_start * 1000
                : null,
              current_period_end: subscription.current_period_end
                ? subscription.current_period_end * 1000
                : null,
              monthly_credit_limit: monthlyCreditLimit,
              monthly_credits_used: 0,
              addon_credits_balance: 0,
              created_at: now,
              updated_at: now,
            });
          }
        }
      }

      if (session.mode === "payment") {
        const addonCredits = Number(session.metadata?.addonCredits ?? "0");
        if (addonCredits > 0) {
          // Check idempotency via checkout session ID
          const { data: existingLedger } = await admin
            .from("credit_ledger")
            .select("id")
            .eq("stripe_checkout_session_id", session.id)
            .single();

          if (!existingLedger) {
            const { data: billingRecord } = await admin
              .from("billing")
              .select("*")
              .eq("user_auth_id", user.id)
              .single();

            if (billingRecord) {
              const newAddonBalance =
                billingRecord.addon_credits_balance + addonCredits;

              await admin
                .from("billing")
                .update({
                  stripe_customer_id: stripeCustomerId,
                  addon_credits_balance: newAddonBalance,
                  updated_at: now,
                })
                .eq("id", billingRecord.id);

              await admin.from("credit_ledger").insert({
                user_auth_id: user.id,
                billing_id: billingRecord.id,
                amount: addonCredits,
                reason: "addon_purchase",
                source: "addon",
                stripe_checkout_session_id: session.id,
                monthly_credits_used_after: billingRecord.monthly_credits_used,
                addon_credits_balance_after: newAddonBalance,
                created_at: now,
              });
            } else {
              // Create billing record if none exists
              const { data: newBilling } = await admin
                .from("billing")
                .insert({
                  user_auth_id: user.id,
                  stripe_customer_id: stripeCustomerId,
                  plan_key: "none",
                  status: "none",
                  monthly_credit_limit: 0,
                  monthly_credits_used: 0,
                  addon_credits_balance: addonCredits,
                  created_at: now,
                  updated_at: now,
                })
                .select("id")
                .single();

              if (newBilling) {
                await admin.from("credit_ledger").insert({
                  user_auth_id: user.id,
                  billing_id: newBilling.id,
                  amount: addonCredits,
                  reason: "addon_purchase",
                  source: "addon",
                  stripe_checkout_session_id: session.id,
                  monthly_credits_used_after: 0,
                  addon_credits_balance_after: addonCredits,
                  created_at: now,
                });
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("GET /api/billing/checkout-status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
