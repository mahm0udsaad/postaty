import Stripe from "stripe";
import { v } from "convex/values";
import {
  action,
  httpAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";

type PlanKey = "starter" | "growth" | "dominant";
type AddonKey = "addon_5" | "addon_10";

const PLAN_CONFIG: Record<
  PlanKey,
  { monthlyCredits: number; firstMonthDiscountCents: number; envVar: string }
> = {
  starter: {
    monthlyCredits: 10,
    firstMonthDiscountCents: 200,
    envVar: "STRIPE_PRICE_STARTER",
  },
  growth: {
    monthlyCredits: 25,
    firstMonthDiscountCents: 400,
    envVar: "STRIPE_PRICE_GROWTH",
  },
  dominant: {
    monthlyCredits: 50,
    firstMonthDiscountCents: 800,
    envVar: "STRIPE_PRICE_DOMINANT",
  },
};

const ADDON_CONFIG: Record<AddonKey, { credits: number; envVar: string }> = {
  addon_5: { credits: 5, envVar: "STRIPE_PRICE_ADDON_5" },
  addon_10: { credits: 10, envVar: "STRIPE_PRICE_ADDON_10" },
};

const MUTABLE_BILLING_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
]);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getStripe() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"));
}

function getPlanPriceId(planKey: PlanKey) {
  return requireEnv(PLAN_CONFIG[planKey].envVar);
}

function getAddonPriceId(addonKey: AddonKey) {
  return requireEnv(ADDON_CONFIG[addonKey].envVar);
}

function extractClerkUserId(identity: { subject?: string | null } | null) {
  if (!identity?.subject) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
}

function toStripeString(value: string | Stripe.DeletedCustomer | null) {
  if (!value || typeof value !== "string") return null;
  return value;
}

function planFromPriceId(priceId: string | undefined): PlanKey | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return "growth";
  if (priceId === process.env.STRIPE_PRICE_DOMINANT) return "dominant";
  return null;
}

async function upsertFromSubscriptionEvent(
  ctx: { runMutation: (...args: any[]) => Promise<any> },
  payload: {
    clerkUserId?: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    planKey: PlanKey;
    status: string;
    currentPeriodStart: number | undefined;
    currentPeriodEnd: number | undefined;
  }
) {
  const monthlyCreditLimit = PLAN_CONFIG[payload.planKey].monthlyCredits;
  const status = MUTABLE_BILLING_STATUSES.has(payload.status)
    ? payload.status
    : "incomplete";

  await ctx.runMutation(internal.billing.upsertBillingFromSubscription, {
    clerkUserId: payload.clerkUserId,
    stripeCustomerId: payload.stripeCustomerId,
    stripeSubscriptionId: payload.stripeSubscriptionId,
    planKey: payload.planKey,
    status,
    currentPeriodStart: payload.currentPeriodStart,
    currentPeriodEnd: payload.currentPeriodEnd,
    monthlyCreditLimit,
  });
}

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = extractClerkUserId(identity);
    return await ctx.db
      .query("billing")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .first();
  },
});

export const getCreditState = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = extractClerkUserId(identity);
    const billing = await ctx.db
      .query("billing")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (!billing) {
      return {
        monthlyRemaining: 0,
        addonRemaining: 0,
        totalRemaining: 0,
        canGenerate: false,
      };
    }

    const monthlyRemaining = Math.max(
      billing.monthlyCreditLimit - billing.monthlyCreditsUsed,
      0
    );
    const addonRemaining = billing.addonCreditsBalance;
    const totalRemaining = monthlyRemaining + addonRemaining;
    const canGenerate =
      !["past_due", "canceled", "none", "unpaid", "incomplete_expired"].includes(
        billing.status
      ) && totalRemaining > 0;

    return {
      ...billing,
      monthlyRemaining,
      addonRemaining,
      totalRemaining,
      canGenerate,
    };
  },
});

export const initializeBillingForCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = extractClerkUserId(identity);

    const existing = await ctx.db
      .query("billing")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .first();
    if (existing) return existing._id;

    const billingId = await ctx.db.insert("billing", {
      clerkUserId,
      stripeCustomerId: undefined,
      stripeSubscriptionId: undefined,
      planKey: "none",
      status: "active",
      currentPeriodStart: undefined,
      currentPeriodEnd: undefined,
      monthlyCreditLimit: 0,
      monthlyCreditsUsed: 0,
      addonCreditsBalance: 10,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("creditLedger", {
      clerkUserId,
      billingId,
      amount: 10,
      reason: "manual_adjustment",
      source: "system",
      stripeEventId: undefined,
      stripeCheckoutSessionId: undefined,
      idempotencyKey: undefined,
      monthlyCreditsUsedAfter: 0,
      addonCreditsBalanceAfter: 10,
      createdAt: Date.now(),
    });

    return billingId;
  },
});

export const consumeGenerationCredit = mutation({
  args: {
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = extractClerkUserId(identity);

    const existingLedgerEntry = await ctx.db
      .query("creditLedger")
      .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (existingLedgerEntry) {
      return {
        ok: true,
        alreadyConsumed: true,
      } as const;
    }

    const billing = await ctx.db
      .query("billing")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (!billing) {
      throw new Error("Billing record not found");
    }

    if (
      ["past_due", "canceled", "none", "unpaid", "incomplete_expired"].includes(
        billing.status
      )
    ) {
      throw new Error("Subscription is not active");
    }

    const monthlyRemaining = Math.max(
      billing.monthlyCreditLimit - billing.monthlyCreditsUsed,
      0
    );
    const addonRemaining = billing.addonCreditsBalance;

    if (monthlyRemaining + addonRemaining < 1) {
      throw new Error("No credits remaining");
    }

    let monthlyCreditsUsed = billing.monthlyCreditsUsed;
    let addonCreditsBalance = billing.addonCreditsBalance;
    let source: "monthly" | "addon" = "monthly";

    if (monthlyRemaining > 0) {
      monthlyCreditsUsed += 1;
      source = "monthly";
    } else {
      addonCreditsBalance -= 1;
      source = "addon";
    }

    await ctx.db.patch(billing._id, {
      monthlyCreditsUsed,
      addonCreditsBalance,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("creditLedger", {
      clerkUserId,
      billingId: billing._id,
      amount: -1,
      reason: "usage",
      source,
      idempotencyKey: args.idempotencyKey,
      monthlyCreditsUsedAfter: monthlyCreditsUsed,
      addonCreditsBalanceAfter: addonCreditsBalance,
      createdAt: Date.now(),
    });

    return {
      ok: true,
      alreadyConsumed: false,
      source,
      monthlyCreditsUsed,
      addonCreditsBalance,
    } as const;
  },
});

export const createSubscriptionCheckout = action({
  args: {
    planKey: v.union(v.literal("starter"), v.literal("growth"), v.literal("dominant")),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = extractClerkUserId(identity);

    const stripe = getStripe();
    const existingBilling = await ctx.runQuery(internal.billing.getBillingByClerkUserId, {
      clerkUserId,
    });

    let stripeCustomerId = existingBilling?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        metadata: { clerkUserId },
      });
      stripeCustomerId = customer.id;
      await ctx.runMutation(internal.billing.upsertBillingProfile, {
        clerkUserId,
        stripeCustomerId,
      });
    }

    const discountCents = PLAN_CONFIG[args.planKey].firstMonthDiscountCents;
    const coupon = await stripe.coupons.create({
      duration: "once",
      amount_off: discountCents,
      currency: "usd",
      name: `First month ${args.planKey}`,
      metadata: { clerkUserId, planKey: args.planKey },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: getPlanPriceId(args.planKey), quantity: 1 }],
      discounts: [{ coupon: coupon.id }],
      allow_promotion_codes: true,
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        clerkUserId,
        planKey: args.planKey,
      },
      subscription_data: {
        metadata: {
          clerkUserId,
          planKey: args.planKey,
        },
      },
    });

    if (!session.url) throw new Error("Stripe Checkout session missing URL");
    return { url: session.url };
  },
});

export const createAddonCheckout = action({
  args: {
    addonKey: v.union(v.literal("addon_5"), v.literal("addon_10")),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = extractClerkUserId(identity);

    const stripe = getStripe();
    const existingBilling = await ctx.runQuery(internal.billing.getBillingByClerkUserId, {
      clerkUserId,
    });

    let stripeCustomerId = existingBilling?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        metadata: { clerkUserId },
      });
      stripeCustomerId = customer.id;
      await ctx.runMutation(internal.billing.upsertBillingProfile, {
        clerkUserId,
        stripeCustomerId,
      });
    }

    const addon = ADDON_CONFIG[args.addonKey];
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      line_items: [{ price: getAddonPriceId(args.addonKey), quantity: 1 }],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        clerkUserId,
        addonKey: args.addonKey,
        addonCredits: String(addon.credits),
      },
    });

    if (!session.url) throw new Error("Stripe Checkout session missing URL");
    return { url: session.url };
  },
});

export const createPortalSession = action({
  args: {
    returnUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = extractClerkUserId(identity);

    const billing = await ctx.runQuery(internal.billing.getBillingByClerkUserId, {
      clerkUserId,
    });
    if (!billing?.stripeCustomerId) {
      throw new Error("Stripe customer not found for current user");
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: args.returnUrl,
    });
    return { url: session.url };
  },
});

export const stripeWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const stripe = getStripe();
  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (error) {
    return new Response(`Webhook signature verification failed: ${String(error)}`, {
      status: 400,
    });
  }

  const shouldProcess = await ctx.runMutation(internal.billing.beginStripeEventProcessing, {
    eventId: event.id,
    type: event.type,
  });

  if (!shouldProcess) {
    return new Response("Event already processed", { status: 200 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const stripeCustomerId = toStripeString(session.customer as string | null);
        if (!stripeCustomerId) break;

        if (session.mode === "subscription") {
          const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : null;
          if (!subscriptionId) break;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
          const planKey = planFromPriceId(
            subscription.items.data[0]?.price?.id
          );
          if (!planKey) throw new Error("Unknown subscription price ID");

          await upsertFromSubscriptionEvent(ctx, {
            clerkUserId: session.metadata?.clerkUserId,
            stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            planKey,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start * 1000,
            currentPeriodEnd: subscription.current_period_end * 1000,
          });
        }

        if (session.mode === "payment") {
          const addonCredits = Number(session.metadata?.addonCredits ?? "0");
          if (addonCredits > 0) {
            await ctx.runMutation(internal.billing.addAddonCredits, {
              stripeCustomerId,
              clerkUserId: session.metadata?.clerkUserId,
              credits: addonCredits,
              stripeEventId: event.id,
              stripeCheckoutSessionId: session.id,
            });
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const stripeCustomerId = toStripeString(subscription.customer as string | null);
        if (!stripeCustomerId) break;

        let planKey = planFromPriceId(subscription.items.data[0]?.price?.id);
        if (!planKey) {
          const existingBilling = await ctx.runQuery(
            internal.billing.getBillingByStripeCustomerId,
            { stripeCustomerId }
          );
          if (existingBilling?.planKey && existingBilling.planKey !== "none") {
            planKey = existingBilling.planKey;
          }
        }

        if (!planKey) {
          throw new Error("Unknown subscription price ID");
        }

        await upsertFromSubscriptionEvent(ctx, {
          clerkUserId: subscription.metadata?.clerkUserId,
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          planKey,
          status: event.type === "customer.subscription.deleted"
            ? "canceled"
            : subscription.status,
          currentPeriodStart: subscription.current_period_start
            ? subscription.current_period_start * 1000
            : undefined,
          currentPeriodEnd: subscription.current_period_end
            ? subscription.current_period_end * 1000
            : undefined,
        });
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as any;
        if (typeof invoice.subscription !== "string") break;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription) as any;
        const planKey = planFromPriceId(subscription.items.data[0]?.price?.id);
        const stripeCustomerId = toStripeString(subscription.customer as string | null);
        if (!stripeCustomerId || !planKey) break;

        await upsertFromSubscriptionEvent(ctx, {
          clerkUserId: subscription.metadata?.clerkUserId,
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          planKey,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start * 1000,
          currentPeriodEnd: subscription.current_period_end * 1000,
        });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const stripeCustomerId = toStripeString(invoice.customer as string | null);
        if (stripeCustomerId) {
          await ctx.runMutation(internal.billing.updateStatusByCustomerId, {
            stripeCustomerId,
            status: "past_due",
          });
        }
        break;
      }
      default:
        break;
    }

    await ctx.runMutation(internal.billing.completeStripeEventProcessing, {
      eventId: event.id,
    });
    return new Response("ok", { status: 200 });
  } catch (error) {
    await ctx.runMutation(internal.billing.failStripeEventProcessing, {
      eventId: event.id,
      error: error instanceof Error ? error.message : "Unknown webhook error",
    });
    return new Response("Webhook processing failed", { status: 500 });
  }
});

export const getBillingByClerkUserId = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("billing")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
  },
});

export const getBillingByStripeCustomerId = internalQuery({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("billing")
      .withIndex("by_stripeCustomerId", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();
  },
});

export const upsertBillingProfile = internalMutation({
  args: {
    clerkUserId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("billing")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        stripeCustomerId: args.stripeCustomerId,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("billing", {
      clerkUserId: args.clerkUserId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: undefined,
      planKey: "none",
      status: "none",
      currentPeriodStart: undefined,
      currentPeriodEnd: undefined,
      monthlyCreditLimit: 0,
      monthlyCreditsUsed: 0,
      addonCreditsBalance: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const upsertBillingFromSubscription = internalMutation({
  args: {
    clerkUserId: v.optional(v.string()),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    planKey: v.union(v.literal("starter"), v.literal("growth"), v.literal("dominant")),
    status: v.union(
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid"),
      v.literal("incomplete"),
      v.literal("incomplete_expired")
    ),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    monthlyCreditLimit: v.number(),
  },
  handler: async (ctx, args) => {
    const bySubscription = await ctx.db
      .query("billing")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    const byCustomer = bySubscription
      ? null
      : await ctx.db
          .query("billing")
          .withIndex("by_stripeCustomerId", (q) =>
            q.eq("stripeCustomerId", args.stripeCustomerId)
          )
          .first();

    const byClerk =
      bySubscription || byCustomer || !args.clerkUserId
        ? null
        : await ctx.db
            .query("billing")
            .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId!))
            .first();

    const existing = bySubscription ?? byCustomer ?? byClerk;
    const clerkUserId = existing?.clerkUserId ?? args.clerkUserId;
    if (!clerkUserId) {
      throw new Error("Unable to map Stripe customer/subscription to a Clerk user");
    }

    const shouldResetMonthlyUsage =
      !!existing &&
      !!args.currentPeriodStart &&
      existing.currentPeriodStart !== args.currentPeriodStart;

    const monthlyCreditsUsed = shouldResetMonthlyUsage
      ? 0
      : (existing?.monthlyCreditsUsed ?? 0);
    const addonCreditsBalance = existing?.addonCreditsBalance ?? 0;

    if (existing) {
      await ctx.db.patch(existing._id, {
        clerkUserId,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        planKey: args.planKey,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        monthlyCreditLimit: args.monthlyCreditLimit,
        monthlyCreditsUsed,
        addonCreditsBalance,
        updatedAt: Date.now(),
      });

      if (shouldResetMonthlyUsage) {
        await ctx.db.insert("creditLedger", {
          clerkUserId,
          billingId: existing._id,
          amount: 0,
          reason: "monthly_reset",
          source: "system",
          stripeEventId: undefined,
          stripeCheckoutSessionId: undefined,
          idempotencyKey: undefined,
          monthlyCreditsUsedAfter: 0,
          addonCreditsBalanceAfter: addonCreditsBalance,
          createdAt: Date.now(),
        });
      }
      return existing._id;
    }

    return await ctx.db.insert("billing", {
      clerkUserId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      planKey: args.planKey,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      monthlyCreditLimit: args.monthlyCreditLimit,
      monthlyCreditsUsed: 0,
      addonCreditsBalance: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const addAddonCredits = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    clerkUserId: v.optional(v.string()),
    credits: v.number(),
    stripeEventId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.credits <= 0) throw new Error("Addon credits must be positive");

    const existingByEventId = args.stripeEventId
      ? await ctx.db
          .query("creditLedger")
          .withIndex("by_stripeEventId", (q) => q.eq("stripeEventId", args.stripeEventId))
          .first()
      : null;
    if (existingByEventId) return existingByEventId._id;

    const byCustomer = await ctx.db
      .query("billing")
      .withIndex("by_stripeCustomerId", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();
    const byClerk =
      byCustomer || !args.clerkUserId
        ? null
        : await ctx.db
            .query("billing")
            .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId!))
            .first();

    const billing = byCustomer ?? byClerk;
    const clerkUserId = billing?.clerkUserId ?? args.clerkUserId;
    if (!clerkUserId) {
      throw new Error("Unable to map add-on payment to a Clerk user");
    }

    if (!billing) {
      const billingId = await ctx.db.insert("billing", {
        clerkUserId,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: undefined,
        planKey: "none",
        status: "none",
        currentPeriodStart: undefined,
        currentPeriodEnd: undefined,
        monthlyCreditLimit: 0,
        monthlyCreditsUsed: 0,
        addonCreditsBalance: args.credits,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("creditLedger", {
        clerkUserId,
        billingId,
        amount: args.credits,
        reason: "addon_purchase",
        source: "addon",
        stripeEventId: args.stripeEventId,
        stripeCheckoutSessionId: args.stripeCheckoutSessionId,
        idempotencyKey: undefined,
        monthlyCreditsUsedAfter: 0,
        addonCreditsBalanceAfter: args.credits,
        createdAt: Date.now(),
      });
      return billingId;
    }

    const newAddonBalance = billing.addonCreditsBalance + args.credits;
    await ctx.db.patch(billing._id, {
      addonCreditsBalance: newAddonBalance,
      updatedAt: Date.now(),
    });
    return await ctx.db.insert("creditLedger", {
      clerkUserId,
      billingId: billing._id,
      amount: args.credits,
      reason: "addon_purchase",
      source: "addon",
      stripeEventId: args.stripeEventId,
      stripeCheckoutSessionId: args.stripeCheckoutSessionId,
      idempotencyKey: undefined,
      monthlyCreditsUsedAfter: billing.monthlyCreditsUsed,
      addonCreditsBalanceAfter: newAddonBalance,
      createdAt: Date.now(),
    });
  },
});

export const updateStatusByCustomerId = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    status: v.union(
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid"),
      v.literal("incomplete"),
      v.literal("incomplete_expired")
    ),
  },
  handler: async (ctx, args) => {
    const billing = await ctx.db
      .query("billing")
      .withIndex("by_stripeCustomerId", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();
    if (!billing) return;
    await ctx.db.patch(billing._id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const beginStripeEventProcessing = internalMutation({
  args: {
    eventId: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();

    if (existing?.status === "processed" || existing?.status === "processing") {
      return false;
    }

    if (existing?.status === "failed") {
      await ctx.db.patch(existing._id, {
        type: args.type,
        status: "processing",
        error: undefined,
        updatedAt: Date.now(),
      });
      return true;
    }

    await ctx.db.insert("stripeEvents", {
      eventId: args.eventId,
      type: args.type,
      status: "processing",
      error: undefined,
      processedAt: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const completeStripeEventProcessing = internalMutation({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    if (!existing) return;

    await ctx.db.patch(existing._id, {
      status: "processed",
      processedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const failStripeEventProcessing = internalMutation({
  args: {
    eventId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    if (!existing) return;

    await ctx.db.patch(existing._id, {
      status: "failed",
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});
