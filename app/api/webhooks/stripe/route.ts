import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// ── Types ────────────────────────────────────────────────────────────

type PlanKey = "starter" | "growth" | "dominant";
type BillingStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired";

type StripeSubscriptionShape = {
  id: string;
  status: string;
  customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  // Deprecated at top-level in Stripe API 2024-06-20+; now lives on items.data[0]
  current_period_start?: number;
  current_period_end?: number;
  items: { data: Array<{ price?: { id?: string }; current_period_start?: number; current_period_end?: number }> };
  metadata?: { userAuthId?: string };
};

type StripeInvoiceShape = {
  id?: string;
  subscription?: string | null;
  customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  amount_paid?: number;
  currency?: string;
  created?: number;
  charge?: string | null;
  parent?: {
    subscription_details?: {
      subscription?: string | null;
      metadata?: Record<string, string>;
    } | null;
  } | null;
};

const PLAN_CONFIG: Record<PlanKey, { monthlyCredits: number }> = {
  starter: { monthlyCredits: 10 },
  growth: { monthlyCredits: 25 },
  dominant: { monthlyCredits: 50 },
};

const PLAN_RANK: Record<string, number> = {
  none: 0,
  starter: 1,
  growth: 2,
  dominant: 3,
};

const MUTABLE_BILLING_STATUSES = new Set([
  "trialing", "active", "past_due", "canceled",
  "unpaid", "incomplete", "incomplete_expired",
]);

// ── Helpers ──────────────────────────────────────────────────────────

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function extractStripeCustomerId(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}

function extractInvoiceSubscriptionId(invoice: StripeInvoiceShape): string | null {
  if (typeof invoice.subscription === "string") return invoice.subscription;
  const parentSub = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSub === "string") return parentSub;
  return null;
}

function estimateStripeFeeCents(amountCents: number): number {
  if (amountCents <= 0) return 0;
  return Math.round(amountCents * 0.06);
}

// ── Period helpers ────────────────────────────────────────────────────

// Stripe API 2024-06-20+ moved current_period_start/end from the subscription
// root to the first subscription item. Support both locations.
function resolvePeriodStart(sub: StripeSubscriptionShape): number | undefined {
  const fromItem = sub.items?.data?.[0]?.current_period_start;
  return fromItem ?? sub.current_period_start;
}

function resolvePeriodEnd(sub: StripeSubscriptionShape): number | undefined {
  const fromItem = sub.items?.data?.[0]?.current_period_end;
  return fromItem ?? sub.current_period_end;
}

// ── Price-to-plan mapping ────────────────────────────────────────────

type PriceMap = Record<string, string>;

async function getActivePrices(): Promise<PriceMap> {
  const admin = createAdminClient();
  const { data: rows } = await admin.from("stripe_prices").select("key, price_id");
  const map: PriceMap = {};
  for (const row of rows || []) {
    map[row.key] = row.price_id;
  }
  return map;
}

function planKeyFromPriceId(prices: PriceMap, priceId: string | undefined): PlanKey | null {
  if (!priceId) return null;
  for (const [key, id] of Object.entries(prices)) {
    if (id === priceId && (key === "starter" || key === "growth" || key === "dominant")) {
      return key;
    }
  }
  return null;
}

// Resolve user auth id from Stripe metadata.
function resolveUserAuthId(metadata?: Record<string, string | undefined>): string | undefined {
  return metadata?.userAuthId;
}

// ── Stripe Event Idempotency ─────────────────────────────────────────

async function beginEventProcessing(eventId: string, type: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("stripe_events")
    .select("id, status")
    .eq("event_id", eventId)
    .single();

  if (existing?.status === "processed" || existing?.status === "processing") {
    return false;
  }

  if (existing?.status === "failed") {
    await admin
      .from("stripe_events")
      .update({ type, status: "processing", error: null, updated_at: Date.now() })
      .eq("id", existing.id);
    return true;
  }

  await admin.from("stripe_events").insert({
    event_id: eventId,
    type,
    status: "processing",
    created_at: Date.now(),
    updated_at: Date.now(),
  });
  return true;
}

async function completeEventProcessing(eventId: string) {
  const admin = createAdminClient();
  await admin
    .from("stripe_events")
    .update({ status: "processed", processed_at: Date.now(), updated_at: Date.now() })
    .eq("event_id", eventId);
}

async function failEventProcessing(eventId: string, error: string) {
  const admin = createAdminClient();
  await admin
    .from("stripe_events")
    .update({ status: "failed", error, updated_at: Date.now() })
    .eq("event_id", eventId);
}

// ── Upsert billing from subscription event ───────────────────────────

async function upsertBillingFromSubscription(payload: {
  userAuthId?: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planKey: PlanKey;
  status: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
}) {
  const admin = createAdminClient();
  const monthlyCreditLimit = PLAN_CONFIG[payload.planKey].monthlyCredits;
  const status: BillingStatus = MUTABLE_BILLING_STATUSES.has(payload.status)
    ? (payload.status as BillingStatus)
    : "incomplete";

  // Find existing billing record by subscription, customer, or user
  let existing: any = null;

  const { data: bySubscription } = await admin
    .from("billing")
    .select("*")
    .eq("stripe_subscription_id", payload.stripeSubscriptionId)
    .single();
  existing = bySubscription;

  if (!existing) {
    const { data: byCustomer } = await admin
      .from("billing")
      .select("*")
      .eq("stripe_customer_id", payload.stripeCustomerId)
      .single();
    existing = byCustomer;
  }

  if (!existing && payload.userAuthId) {
    const { data: byUser } = await admin
      .from("billing")
      .select("*")
      .eq("user_auth_id", payload.userAuthId)
      .single();
    existing = byUser;
  }

  const userAuthId = existing?.user_auth_id ?? payload.userAuthId;
  if (!userAuthId) {
    throw new Error("Unable to map Stripe customer/subscription to a user");
  }

  const shouldResetMonthlyUsage =
    !!existing &&
    !!payload.currentPeriodStart &&
    existing.current_period_start !== payload.currentPeriodStart;

  // Carry over remaining monthly credits when upgrading to a higher plan
  const oldPlanKey = existing?.plan_key ?? "none";
  const isUpgrade = PLAN_RANK[payload.planKey] > PLAN_RANK[oldPlanKey];
  const carryOver =
    shouldResetMonthlyUsage && isUpgrade
      ? Math.max(
          (existing?.monthly_credit_limit ?? 0) - (existing?.monthly_credits_used ?? 0),
          0
        )
      : 0;

  const monthlyCreditsUsed = shouldResetMonthlyUsage ? 0 : (existing?.monthly_credits_used ?? 0);
  const addonCreditsBalance = (existing?.addon_credits_balance ?? 0) + carryOver;
  const now = Date.now();

  if (existing) {
    await admin
      .from("billing")
      .update({
        user_auth_id: userAuthId,
        stripe_customer_id: payload.stripeCustomerId,
        stripe_subscription_id: payload.stripeSubscriptionId,
        plan_key: payload.planKey,
        status,
        current_period_start: payload.currentPeriodStart,
        current_period_end: payload.currentPeriodEnd,
        monthly_credit_limit: monthlyCreditLimit,
        monthly_credits_used: monthlyCreditsUsed,
        addon_credits_balance: addonCreditsBalance,
        updated_at: now,
      })
      .eq("id", existing.id);

    if (shouldResetMonthlyUsage) {
      await admin.from("credit_ledger").insert({
        user_auth_id: userAuthId,
        billing_id: existing.id,
        amount: 0,
        reason: "monthly_reset",
        source: "system",
        monthly_credits_used_after: 0,
        addon_credits_balance_after: addonCreditsBalance,
        created_at: now,
      });

      if (carryOver > 0) {
        await admin.from("credit_ledger").insert({
          user_auth_id: userAuthId,
          billing_id: existing.id,
          amount: carryOver,
          reason: "manual_adjustment",
          source: "addon",
          monthly_credits_used_after: 0,
          addon_credits_balance_after: addonCreditsBalance,
          created_at: now,
        });
      }
    }

    if (status === "canceled" && existing.status !== "canceled") {
      await admin.from("notifications").insert({
        user_auth_id: userAuthId,
        title: "تم إلغاء اشتراكك",
        body: "تم إلغاء اشتراكك. يمكنك إعادة الاشتراك في أي وقت من صفحة الإعدادات.",
        type: "warning",
        is_read: false,
        metadata: JSON.stringify({ event: "subscription_canceled" }),
        created_at: now,
      });
    }

    return existing.id;
  }

  // Create new billing record
  const { data: newBilling } = await admin
    .from("billing")
    .insert({
      user_auth_id: userAuthId,
      stripe_customer_id: payload.stripeCustomerId,
      stripe_subscription_id: payload.stripeSubscriptionId,
      plan_key: payload.planKey,
      status,
      current_period_start: payload.currentPeriodStart,
      current_period_end: payload.currentPeriodEnd,
      monthly_credit_limit: monthlyCreditLimit,
      monthly_credits_used: 0,
      addon_credits_balance: 0,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  return newBilling?.id;
}

// ── Add addon credits ────────────────────────────────────────────────

async function addAddonCredits(payload: {
  stripeCustomerId: string;
  userAuthId?: string;
  credits: number;
  stripeEventId?: string;
  stripeCheckoutSessionId?: string;
}) {
  const admin = createAdminClient();
  if (payload.credits <= 0) throw new Error("Addon credits must be positive");

  // Idempotency check
  if (payload.stripeEventId) {
    const { data: existing } = await admin
      .from("credit_ledger")
      .select("id")
      .eq("idempotency_key", `stripe_event_${payload.stripeEventId}`)
      .single();
    if (existing) return existing.id;
  }

  // Find billing record
  let billing: any = null;
  const { data: byCustomer } = await admin
    .from("billing")
    .select("*")
    .eq("stripe_customer_id", payload.stripeCustomerId)
    .single();
  billing = byCustomer;

  if (!billing && payload.userAuthId) {
    const { data: byUser } = await admin
      .from("billing")
      .select("*")
      .eq("user_auth_id", payload.userAuthId)
      .single();
    billing = byUser;
  }

  const userAuthId = billing?.user_auth_id ?? payload.userAuthId;
  if (!userAuthId) throw new Error("Unable to map add-on payment to a user");

  const now = Date.now();

  if (!billing) {
    const { data: newBilling } = await admin
      .from("billing")
      .insert({
        user_auth_id: userAuthId,
        stripe_customer_id: payload.stripeCustomerId,
        plan_key: "none",
        status: "none",
        monthly_credit_limit: 0,
        monthly_credits_used: 0,
        addon_credits_balance: payload.credits,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    await admin.from("credit_ledger").insert({
      user_auth_id: userAuthId,
      billing_id: newBilling!.id,
      amount: payload.credits,
      reason: "addon_purchase",
      source: "addon",
      idempotency_key: payload.stripeEventId ? `stripe_event_${payload.stripeEventId}` : null,
      monthly_credits_used_after: 0,
      addon_credits_balance_after: payload.credits,
      created_at: now,
    });
    return newBilling!.id;
  }

  const newAddonBalance = billing.addon_credits_balance + payload.credits;
  await admin
    .from("billing")
    .update({ addon_credits_balance: newAddonBalance, updated_at: now })
    .eq("id", billing.id);

  await admin.from("credit_ledger").insert({
    user_auth_id: userAuthId,
    billing_id: billing.id,
    amount: payload.credits,
    reason: "addon_purchase",
    source: "addon",
    idempotency_key: payload.stripeEventId ? `stripe_event_${payload.stripeEventId}` : null,
    monthly_credits_used_after: billing.monthly_credits_used,
    addon_credits_balance_after: newAddonBalance,
    created_at: now,
  });
}

// ── Record revenue event ─────────────────────────────────────────────

async function recordRevenueEvent(payload: {
  stripeEventId: string;
  stripeObjectId?: string;
  userAuthId?: string;
  stripeCustomerId?: string;
  source: "subscription_invoice" | "addon_checkout";
  amountCents: number;
  currency: string;
  occurredAt: number;
  actualStripeFeeCents?: number;
}) {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("stripe_revenue_events")
    .select("id")
    .eq("stripe_event_id", payload.stripeEventId)
    .single();
  if (existing) return existing.id;

  const estimatedStripeFeeCents = estimateStripeFeeCents(payload.amountCents);
  const feeCents = payload.actualStripeFeeCents ?? estimatedStripeFeeCents;
  const netAmountCents = Math.max(payload.amountCents - feeCents, 0);

  const { data } = await admin
    .from("stripe_revenue_events")
    .insert({
      stripe_event_id: payload.stripeEventId,
      stripe_object_id: payload.stripeObjectId,
      user_auth_id: payload.userAuthId,
      stripe_customer_id: payload.stripeCustomerId,
      source: payload.source,
      amount_cents: payload.amountCents,
      currency: payload.currency.toUpperCase(),
      estimated_stripe_fee_cents: estimatedStripeFeeCents,
      actual_stripe_fee_cents: payload.actualStripeFeeCents,
      net_amount_cents: netAmountCents,
      occurred_at: payload.occurredAt,
      created_at: Date.now(),
    })
    .select("id")
    .single();

  return data?.id;
}

// ── Update billing status by customer ID ─────────────────────────────

async function updateStatusByCustomerId(stripeCustomerId: string, newStatus: BillingStatus) {
  const admin = createAdminClient();
  const { data: billing } = await admin
    .from("billing")
    .select("*")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (!billing) return;

  await admin
    .from("billing")
    .update({ status: newStatus, updated_at: Date.now() })
    .eq("id", billing.id);

  if (newStatus === "past_due") {
    await admin.from("notifications").insert({
      user_auth_id: billing.user_auth_id,
      title: "مشكلة في الدفع",
      body: "لم نتمكن من تحصيل اشتراكك. يرجى تحديث طريقة الدفع لتجنب انقطاع الخدمة.",
      type: "warning",
      is_read: false,
      metadata: JSON.stringify({ event: "payment_failed" }),
      created_at: Date.now(),
    });
  }
}

// ── Webhook Handler ──────────────────────────────────────────────────

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed:", String(error));
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  // Idempotency: check if already processed
  const shouldProcess = await beginEventProcessing(event.id, event.type);
  if (!shouldProcess) {
    return NextResponse.json({ ok: true, message: "Event already processed" });
  }

  const prices = await getActivePrices();

  console.log(`[Stripe Webhook] Processing event: ${event.type} (${event.id})`);
  try {
    switch (event.type) {
      // ── Checkout completed ──────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;
        if (!stripeCustomerId) break;

        if (session.mode === "subscription") {
          const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : null;
          if (!subscriptionId) break;

          const subscription = (await stripe.subscriptions.retrieve(
            subscriptionId
          )) as unknown as StripeSubscriptionShape;
          const planKey = planKeyFromPriceId(prices, subscription.items.data[0]?.price?.id);
          if (!planKey) throw new Error("Unknown subscription price ID");

          const userAuthId = resolveUserAuthId(
            session.metadata as Record<string, string | undefined>
          );

          await upsertBillingFromSubscription({
            userAuthId,
            stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            planKey,
            status: subscription.status,
            currentPeriodStart: resolvePeriodStart(subscription)
              ? resolvePeriodStart(subscription)! * 1000
              : undefined,
            currentPeriodEnd: resolvePeriodEnd(subscription)
              ? resolvePeriodEnd(subscription)! * 1000
              : undefined,
          });
        }

        if (session.mode === "payment") {
          const addonCredits = Number(session.metadata?.addonCredits ?? "0");
          const userAuthId = resolveUserAuthId(
            session.metadata as Record<string, string | undefined>
          );

          if (addonCredits > 0) {
            await addAddonCredits({
              stripeCustomerId,
              userAuthId,
              credits: addonCredits,
              stripeEventId: event.id,
              stripeCheckoutSessionId: session.id,
            });
          }

          const amountCents = session.amount_total ?? 0;
          if (amountCents > 0) {
            let actualStripeFeeCents: number | undefined;
            const paymentIntentId = typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent as any)?.id;

            if (paymentIntentId) {
              try {
                const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
                  expand: ["latest_charge.balance_transaction"],
                });
                const charge = pi.latest_charge;
                if (charge && typeof charge === "object" && "balance_transaction" in charge) {
                  const bt = (charge as any).balance_transaction;
                  if (bt && typeof bt === "object" && "fee" in bt) {
                    actualStripeFeeCents = bt.fee;
                  }
                }
              } catch {
                // Fall back to estimated fee
              }
            }

            await recordRevenueEvent({
              stripeEventId: event.id,
              stripeObjectId: session.id,
              userAuthId,
              stripeCustomerId,
              source: "addon_checkout",
              amountCents,
              currency: (session.currency ?? "usd").toUpperCase(),
              occurredAt: session.created ? session.created * 1000 : Date.now(),
              actualStripeFeeCents,
            });
          }
        }
        break;
      }

      // ── Subscription lifecycle ──────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as StripeSubscriptionShape;
        const stripeCustomerId = extractStripeCustomerId(subscription.customer);
        if (!stripeCustomerId) break;

        let planKey = planKeyFromPriceId(prices, subscription.items.data[0]?.price?.id);
        if (!planKey) {
          const admin = createAdminClient();
          const { data: existingBilling } = await admin
            .from("billing")
            .select("plan_key")
            .eq("stripe_customer_id", stripeCustomerId)
            .single();

          if (existingBilling?.plan_key && existingBilling.plan_key !== "none") {
            planKey = existingBilling.plan_key as PlanKey;
          }
        }

        if (!planKey) throw new Error("Unknown subscription price ID");

        const userAuthId = resolveUserAuthId(
          subscription.metadata as Record<string, string | undefined>
        );

        await upsertBillingFromSubscription({
          userAuthId,
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          planKey,
          status: event.type === "customer.subscription.deleted"
            ? "canceled"
            : subscription.status,
          currentPeriodStart: resolvePeriodStart(subscription)
            ? resolvePeriodStart(subscription)! * 1000
            : undefined,
          currentPeriodEnd: resolvePeriodEnd(subscription)
            ? resolvePeriodEnd(subscription)! * 1000
            : undefined,
        });
        break;
      }

      // ── Invoice paid (subscription renewal) ─────────────────────
      case "invoice.paid": {
        const invoice = event.data.object as unknown as StripeInvoiceShape;
        const invoiceSubId = extractInvoiceSubscriptionId(invoice);
        if (!invoiceSubId) break;

        const subscription = (await stripe.subscriptions.retrieve(
          invoiceSubId
        )) as unknown as StripeSubscriptionShape;
        const planKey = planKeyFromPriceId(prices, subscription.items.data[0]?.price?.id);
        const stripeCustomerId = extractStripeCustomerId(subscription.customer);
        if (!stripeCustomerId || !planKey) break;

        const userAuthId = resolveUserAuthId(
          subscription.metadata as Record<string, string | undefined>
        );

        await upsertBillingFromSubscription({
          userAuthId,
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          planKey,
          status: subscription.status,
          currentPeriodStart: resolvePeriodStart(subscription)
            ? resolvePeriodStart(subscription)! * 1000
            : undefined,
          currentPeriodEnd: resolvePeriodEnd(subscription)
            ? resolvePeriodEnd(subscription)! * 1000
            : undefined,
        });

        const amountPaid = typeof invoice.amount_paid === "number" ? invoice.amount_paid : 0;
        if (amountPaid > 0) {
          let actualStripeFeeCents: number | undefined;
          if (typeof invoice.charge === "string") {
            try {
              const charge = await stripe.charges.retrieve(invoice.charge, {
                expand: ["balance_transaction"],
              });
              const bt = charge.balance_transaction;
              if (bt && typeof bt === "object" && "fee" in bt) {
                actualStripeFeeCents = (bt as any).fee;
              }
            } catch {
              // Fall back to estimated
            }
          }

          await recordRevenueEvent({
            stripeEventId: event.id,
            stripeObjectId: typeof invoice.id === "string" ? invoice.id : undefined,
            userAuthId,
            stripeCustomerId,
            source: "subscription_invoice",
            amountCents: amountPaid,
            currency: typeof invoice.currency === "string"
              ? invoice.currency.toUpperCase()
              : "USD",
            occurredAt: invoice.created ? invoice.created * 1000 : Date.now(),
            actualStripeFeeCents,
          });
        }
        break;
      }

      // ── Invoice payment failed ──────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as StripeInvoiceShape;
        const stripeCustomerId = extractStripeCustomerId(invoice.customer);
        if (stripeCustomerId) {
          await updateStatusByCustomerId(stripeCustomerId, "past_due");
        }
        break;
      }

      default:
        break;
    }

    await completeEventProcessing(event.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
    await failEventProcessing(
      event.id,
      error instanceof Error ? error.message : "Unknown webhook error"
    );
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
