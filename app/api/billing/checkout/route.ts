import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

type PlanKey = "starter" | "growth" | "dominant";
type AddonKey = "addon_5" | "addon_10";

const PLAN_CONFIG: Record<
  PlanKey,
  { monthlyCredits: number; firstMonthDiscountCents: number }
> = {
  starter: { monthlyCredits: 15, firstMonthDiscountCents: 200 },
  growth: { monthlyCredits: 35, firstMonthDiscountCents: 400 },
  dominant: { monthlyCredits: 70, firstMonthDiscountCents: 800 },
};

const ADDON_CONFIG: Record<AddonKey, { credits: number }> = {
  addon_5: { credits: 5 },
  addon_10: { credits: 10 },
};

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();
    const body = await request.json();
    const { planKey, addonKey, successUrl, cancelUrl } = body as {
      planKey?: PlanKey;
      addonKey?: AddonKey;
      successUrl: string;
      cancelUrl: string;
    };

    if (!planKey && !addonKey) {
      return NextResponse.json(
        { error: "Must specify either planKey or addonKey" },
        { status: 400 }
      );
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "successUrl and cancelUrl are required" },
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

    // Get or create Stripe customer
    const { data: billing } = await admin
      .from("billing")
      .select("id, stripe_customer_id")
      .eq("user_auth_id", user.id)
      .single();

    let stripeCustomerId = billing?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        metadata: { userAuthId: user.id },
      });
      stripeCustomerId = customer.id;

      // Update or create billing with customer ID
      if (billing) {
        await admin
          .from("billing")
          .update({
            stripe_customer_id: stripeCustomerId,
            updated_at: Date.now(),
          })
          .eq("id", billing.id);
      } else {
        await admin.from("billing").insert({
          user_auth_id: user.id,
          stripe_customer_id: stripeCustomerId,
          plan_key: "none",
          status: "none",
          monthly_credit_limit: 0,
          monthly_credits_used: 0,
          addon_credits_balance: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
    }

    // Subscription checkout
    if (planKey) {
      const priceId = prices[planKey];
      if (!priceId) {
        return NextResponse.json(
          { error: `No active Stripe price configured for "${planKey}"` },
          { status: 400 }
        );
      }

      // Create first-month discount coupon
      const discountCents = PLAN_CONFIG[planKey].firstMonthDiscountCents;
      const coupon = await stripe.coupons.create({
        duration: "once",
        amount_off: discountCents,
        currency: "usd",
        name: `First month ${planKey}`,
        metadata: { userAuthId: user.id, planKey },
      });

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        discounts: [{ coupon: coupon.id }],
        allow_promotion_codes: true,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userAuthId: user.id,
          planKey,
        },
        subscription_data: {
          metadata: {
            userAuthId: user.id,
            planKey,
          },
        },
      });

      if (!session.url) {
        return NextResponse.json(
          { error: "Stripe Checkout session missing URL" },
          { status: 500 }
        );
      }

      return NextResponse.json({ url: session.url });
    }

    // Addon checkout
    const priceId = prices[addonKey!];
    if (!priceId) {
      return NextResponse.json(
        { error: `No active Stripe price configured for "${addonKey}"` },
        { status: 400 }
      );
    }

    const addon = ADDON_CONFIG[addonKey!];
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userAuthId: user.id,
        addonKey: addonKey!,
        addonCredits: String(addon.credits),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe Checkout session missing URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/billing/checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
