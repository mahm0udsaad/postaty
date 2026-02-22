import Stripe from "stripe";
import { v } from "convex/values";
import {
  type ActionCtx,
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
type CheckoutTheme = "dark" | "light";
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
  current_period_start?: number;
  current_period_end?: number;
  items: { data: Array<{ price?: { id?: string } }> };
  metadata?: { clerkUserId?: string };
};

type StripeInvoiceShape = {
  id?: string;
  subscription?: string | null;
  customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  amount_paid?: number;
  currency?: string;
  created?: number;
  charge?: string | null;
  // Stripe API v2026-01-28+ moves subscription to parent.subscription_details
  parent?: {
    subscription_details?: {
      subscription?: string | null;
      metadata?: Record<string, string>;
    } | null;
  } | null;
};

const PLAN_CONFIG: Record<
  PlanKey,
  { monthlyCredits: number; firstMonthDiscountCents: number }
> = {
  starter: { monthlyCredits: 10, firstMonthDiscountCents: 200 },
  growth: { monthlyCredits: 25, firstMonthDiscountCents: 400 },
  dominant: { monthlyCredits: 50, firstMonthDiscountCents: 800 },
};

const ADDON_CONFIG: Record<AddonKey, { credits: number }> = {
  addon_5: { credits: 5 },
  addon_10: { credits: 10 },
};

type PriceMap = Record<string, string>;

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

function resolvePriceId(prices: PriceMap, key: string): string {
  const priceId = prices[key];
  if (!priceId) {
    throw new Error(`No active Stripe price configured for "${key}". Set it in admin → Price Mappings.`);
  }
  return priceId;
}

function extractInvoiceSubscriptionId(invoice: StripeInvoiceShape): string | null {
  if (typeof invoice.subscription === "string") return invoice.subscription;
  const parentSub = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSub === "string") return parentSub;
  return null;
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

function extractStripeCustomerId(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}


function estimateStripeFeeCents(amountCents: number): number {
  if (amountCents <= 0) return 0;
  return Math.round(amountCents * 0.029 + 30);
}

function getCheckoutBrandingSettings(
  theme: CheckoutTheme
): Stripe.Checkout.SessionCreateParams.BrandingSettings {
  if (theme === "light") {
    return {
      background_color: "#ffffff",
      button_color: "#7C3AED",
      border_style: "rounded",
      font_family: "noto_sans",
    };
  }

  return {
    background_color: "#12122a",
    button_color: "#8B5CF6",
    border_style: "rounded",
    font_family: "noto_sans",
  };
}

async function upsertFromSubscriptionEvent(
  ctx: { runMutation: ActionCtx["runMutation"] },
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
  const status: BillingStatus = MUTABLE_BILLING_STATUSES.has(payload.status)
    ? (payload.status as BillingStatus)
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
        planKey: "none" as const,
        status: "none" as const,
        monthlyCreditLimit: 0,
        monthlyCreditsUsed: 0,
        currentPeriodStart: undefined,
        currentPeriodEnd: undefined,
        addonCreditsBalance: 0,
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
    const hasSubscription = billing.planKey !== "none";
    const hasEligibleStatus = ![
      "past_due",
      "canceled",
      "none",
      "unpaid",
      "incomplete_expired",
    ].includes(billing.status);
    const canGenerate = hasSubscription && hasEligibleStatus && totalRemaining > 0;

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

    return await ctx.db.insert("billing", {
      clerkUserId,
      stripeCustomerId: undefined,
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

    if (billing.planKey === "none") {
      throw new Error("Active subscription is required");
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

    // ── Low-credit notification ──────────────────────────────────
    const newMonthlyRemaining = Math.max(
      billing.monthlyCreditLimit - monthlyCreditsUsed,
      0
    );
    const newTotalRemaining = newMonthlyRemaining + addonCreditsBalance;

    const CREDIT_THRESHOLDS = [
      {
        remaining: 0,
        key: "remaining_0",
        title: "نفد رصيدك",
        body: "لقد استخدمت جميع أرصدتك. اشترِ أرصدة إضافية أو انتظر تجديد الاشتراك.",
      },
      {
        remaining: 1,
        key: "remaining_1",
        title: "رصيد واحد متبقي!",
        body: "باقي لديك رصيد واحد فقط! اشترِ أرصدة إضافية لتتمكن من الاستمرار.",
      },
      {
        remaining: 3,
        key: "remaining_3",
        title: "رصيدك ينخفض",
        body: "باقي لديك 3 أرصدة فقط. فكّر بشراء أرصدة إضافية.",
      },
    ];

    const matchedThreshold = CREDIT_THRESHOLDS.find(
      (t) => newTotalRemaining <= t.remaining
    );

    if (matchedThreshold) {
      const periodStart = billing.currentPeriodStart ?? 0;

      const existingNotifications = await ctx.db
        .query("notifications")
        .withIndex("by_clerkUserId", (q) =>
          q.eq("clerkUserId", clerkUserId)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "credit"),
            q.gte(q.field("createdAt"), periodStart)
          )
        )
        .collect();

      const alreadySent = existingNotifications.some((n) => {
        if (!n.metadata) return false;
        try {
          const meta = JSON.parse(n.metadata);
          return meta.threshold === matchedThreshold.key;
        } catch {
          return false;
        }
      });

      if (!alreadySent) {
        await ctx.db.insert("notifications", {
          clerkUserId,
          title: matchedThreshold.title,
          body: matchedThreshold.body,
          type: "credit",
          isRead: false,
          metadata: JSON.stringify({
            threshold: matchedThreshold.key,
            totalRemaining: newTotalRemaining,
          }),
          createdAt: Date.now(),
        });
      }
    }

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

    const prices = await ctx.runQuery(internal.billing.getActivePrices);
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
      line_items: [{ price: resolvePriceId(prices, args.planKey), quantity: 1 }],
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

    const prices = await ctx.runQuery(internal.billing.getActivePrices);
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
      line_items: [{ price: resolvePriceId(prices, args.addonKey), quantity: 1 }],
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
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return new Response("Missing stripe-signature header", { status: 400 });
  }
  console.log("[Stripe Webhook] Received event, verifying signature...");

  const prices = await ctx.runQuery(internal.billing.getActivePrices);
  const stripe = getStripe();
  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed:", String(error));
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

  console.log(`[Stripe Webhook] Processing event: ${event.type} (${event.id})`);
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
          const subscription = (await stripe.subscriptions.retrieve(
            subscriptionId
          )) as unknown as StripeSubscriptionShape;
          const planKey = planKeyFromPriceId(prices,
            subscription.items.data[0]?.price?.id
          );
          if (!planKey) throw new Error("Unknown subscription price ID");

          await upsertFromSubscriptionEvent(ctx, {
            clerkUserId: session.metadata?.clerkUserId,
            stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            planKey,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start
              ? subscription.current_period_start * 1000
              : undefined,
            currentPeriodEnd: subscription.current_period_end
              ? subscription.current_period_end * 1000
              : undefined,
          });

          // Send subscription confirmation email
          const customerEmail =
            (session as unknown as { customer_details?: { email?: string; name?: string } })
              .customer_details?.email ??
            (session as unknown as { customer_email?: string }).customer_email;
          const customerName =
            (session as unknown as { customer_details?: { name?: string } })
              .customer_details?.name ?? "عميل";
          if (customerEmail) {
            await ctx.scheduler.runAfter(0, internal.emailing.sendSubscriptionConfirmationEmail, {
              toEmail: customerEmail,
              userName: customerName,
              planKey,
              amountCents: session.amount_total ?? 0,
              currency: (session.currency ?? "usd").toUpperCase(),
              monthlyCredits: PLAN_CONFIG[planKey]?.monthlyCredits ?? 0,
              clerkUserId: session.metadata?.clerkUserId,
            });
          }
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

          const amountCents = session.amount_total ?? 0;
          if (amountCents > 0) {
            // Fetch actual Stripe fee from the payment intent's charge
            let actualStripeFeeCents: number | undefined;
            const paymentIntentId = typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id;
            if (paymentIntentId) {
              try {
                const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
                  expand: ["latest_charge.balance_transaction"],
                });
                const charge = pi.latest_charge;
                if (charge && typeof charge === "object" && "balance_transaction" in charge) {
                  const bt = charge.balance_transaction;
                  if (bt && typeof bt === "object" && "fee" in bt) {
                    actualStripeFeeCents = (bt as { fee: number }).fee;
                  }
                }
              } catch {
                // Fall back to estimated fee
              }
            }

            await ctx.runMutation(internal.billing.recordRevenueEvent, {
              stripeEventId: event.id,
              stripeObjectId: session.id,
              clerkUserId: session.metadata?.clerkUserId,
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
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as StripeSubscriptionShape;
        const stripeCustomerId = extractStripeCustomerId(subscription.customer);
        if (!stripeCustomerId) break;

        let planKey = planKeyFromPriceId(prices,subscription.items.data[0]?.price?.id);
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
        const invoice = event.data.object as unknown as StripeInvoiceShape;
        const invoiceSubId = extractInvoiceSubscriptionId(invoice);
        if (!invoiceSubId) break;
        const subscription = (await stripe.subscriptions.retrieve(
          invoiceSubId
        )) as unknown as StripeSubscriptionShape;
        const planKey = planKeyFromPriceId(prices,subscription.items.data[0]?.price?.id);
        const stripeCustomerId = extractStripeCustomerId(subscription.customer);
        if (!stripeCustomerId || !planKey) break;

        await upsertFromSubscriptionEvent(ctx, {
          clerkUserId: subscription.metadata?.clerkUserId,
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          planKey,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start
            ? subscription.current_period_start * 1000
            : undefined,
          currentPeriodEnd: subscription.current_period_end
            ? subscription.current_period_end * 1000
            : undefined,
        });

        const amountPaid = typeof invoice.amount_paid === "number" ? invoice.amount_paid : 0;
        if (amountPaid > 0) {
          // Fetch actual Stripe fee from the charge's balance transaction
          let actualStripeFeeCents: number | undefined;
          if (typeof invoice.charge === "string") {
            try {
              const charge = await stripe.charges.retrieve(invoice.charge, {
                expand: ["balance_transaction"],
              });
              const bt = charge.balance_transaction;
              if (bt && typeof bt === "object" && "fee" in bt) {
                actualStripeFeeCents = bt.fee;
              }
            } catch {
              // Fall back to estimated fee if retrieval fails
            }
          }

          await ctx.runMutation(internal.billing.recordRevenueEvent, {
            stripeEventId: event.id,
            stripeObjectId: typeof invoice.id === "string" ? invoice.id : undefined,
            clerkUserId: subscription.metadata?.clerkUserId,
            stripeCustomerId,
            source: "subscription_invoice",
            amountCents: amountPaid,
            currency:
              typeof invoice.currency === "string"
                ? invoice.currency.toUpperCase()
                : "USD",
            occurredAt: invoice.created ? invoice.created * 1000 : Date.now(),
            actualStripeFeeCents,
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as StripeInvoiceShape;
        const stripeCustomerId = extractStripeCustomerId(invoice.customer);
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

// ── Stripe Price Mappings ─────────────────────────────────────────

export const getActivePrices = internalQuery({
  args: {},
  handler: async (ctx): Promise<PriceMap> => {
    const rows = await ctx.db.query("stripePrices").collect();
    const map: PriceMap = {};
    for (const row of rows) {
      map[row.key] = row.priceId;
    }
    return map;
  },
});

export const listActivePrices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("stripePrices").collect();
  },
});

export const setActivePrice = internalMutation({
  args: {
    key: v.string(),
    priceId: v.string(),
    productId: v.string(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripePrices")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        priceId: args.priceId,
        productId: args.productId,
        label: args.label,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    return await ctx.db.insert("stripePrices", {
      key: args.key,
      priceId: args.priceId,
      productId: args.productId,
      label: args.label,
      updatedAt: Date.now(),
    });
  },
});

// Update all existing mappings for a given productId to use a new priceId
export const updatePriceForProduct = internalMutation({
  args: {
    productId: v.string(),
    newPriceId: v.string(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("stripePrices")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();
    let updated = 0;
    for (const row of rows) {
      if (row.priceId !== args.newPriceId) {
        await ctx.db.patch(row._id, {
          priceId: args.newPriceId,
          updatedAt: Date.now(),
        });
        updated++;
      }
    }
    return updated;
  },
});

export const deleteActivePrice = internalMutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripePrices")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
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

      if (args.status === "canceled" && existing.status !== "canceled") {
        await ctx.db.insert("notifications", {
          clerkUserId,
          title: "تم إلغاء اشتراكك",
          body: "تم إلغاء اشتراكك. يمكنك إعادة الاشتراك في أي وقت من صفحة الإعدادات.",
          type: "warning",
          isRead: false,
          metadata: JSON.stringify({ event: "subscription_canceled" }),
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
    const existingByCheckoutSessionId = args.stripeCheckoutSessionId
      ? await ctx.db
          .query("creditLedger")
          .filter((q) =>
            q.eq(q.field("stripeCheckoutSessionId"), args.stripeCheckoutSessionId)
          )
          .first()
      : null;
    if (existingByEventId) return existingByEventId._id;
    if (existingByCheckoutSessionId) return existingByCheckoutSessionId._id;

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

    if (args.status === "past_due") {
      await ctx.db.insert("notifications", {
        clerkUserId: billing.clerkUserId,
        title: "مشكلة في الدفع",
        body: "لم نتمكن من تحصيل اشتراكك. يرجى تحديث طريقة الدفع لتجنب انقطاع الخدمة.",
        type: "warning",
        isRead: false,
        metadata: JSON.stringify({ event: "payment_failed" }),
        createdAt: Date.now(),
      });
    }
  },
});

export const recordRevenueEvent = internalMutation({
  args: {
    stripeEventId: v.string(),
    stripeObjectId: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    source: v.union(v.literal("subscription_invoice"), v.literal("addon_checkout")),
    amountCents: v.number(),
    currency: v.string(),
    occurredAt: v.number(),
    actualStripeFeeCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeRevenueEvents")
      .withIndex("by_eventId", (q) => q.eq("stripeEventId", args.stripeEventId))
      .first();
    if (existing) return existing._id;

    const estimatedStripeFeeCents = estimateStripeFeeCents(args.amountCents);
    const feeCents = args.actualStripeFeeCents ?? estimatedStripeFeeCents;
    const netAmountCents = Math.max(args.amountCents - feeCents, 0);

    return await ctx.db.insert("stripeRevenueEvents", {
      stripeEventId: args.stripeEventId,
      stripeObjectId: args.stripeObjectId,
      clerkUserId: args.clerkUserId,
      stripeCustomerId: args.stripeCustomerId,
      source: args.source,
      amountCents: args.amountCents,
      currency: args.currency.toUpperCase(),
      estimatedStripeFeeCents,
      actualStripeFeeCents: args.actualStripeFeeCents,
      netAmountCents,
      occurredAt: args.occurredAt,
      createdAt: Date.now(),
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

// ── Embedded Checkout ──────────────────────────────────────────────

export const createEmbeddedCheckout = action({
  args: {
    planKey: v.optional(
      v.union(v.literal("starter"), v.literal("growth"), v.literal("dominant"))
    ),
    addonKey: v.optional(v.union(v.literal("addon_5"), v.literal("addon_10"))),
    couponId: v.optional(v.string()),
    theme: v.optional(v.union(v.literal("dark"), v.literal("light"))),
    returnUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ clientSecret: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = extractClerkUserId(identity);

    if (!args.planKey && !args.addonKey) {
      throw new Error("Must specify either planKey or addonKey");
    }

    const prices = await ctx.runQuery(internal.billing.getActivePrices);
    const stripe = getStripe();
    const brandingSettings = getCheckoutBrandingSettings(args.theme ?? "dark");
    const existingBilling = await ctx.runQuery(
      internal.billing.getBillingByClerkUserId,
      { clerkUserId }
    );

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

    if (args.planKey) {
      const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];

      if (args.couponId) {
        discounts.push({ coupon: args.couponId });
      } else {
        const discountCents = PLAN_CONFIG[args.planKey].firstMonthDiscountCents;
        if (discountCents > 0) {
          const coupon = await stripe.coupons.create({
            duration: "once",
            amount_off: discountCents,
            currency: "usd",
            name: `First month ${args.planKey}`,
            metadata: { clerkUserId, planKey: args.planKey },
          });
          discounts.push({ coupon: coupon.id });
        }
      }

      const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded",
        mode: "subscription",
        branding_settings: brandingSettings,
        customer: stripeCustomerId,
        line_items: [{ price: resolvePriceId(prices, args.planKey), quantity: 1 }],
        ...(discounts.length > 0 ? { discounts } : {}),
        return_url: args.returnUrl,
        metadata: { clerkUserId, planKey: args.planKey },
        subscription_data: {
          metadata: { clerkUserId, planKey: args.planKey },
        },
      });

      if (!session.client_secret) {
        throw new Error("Missing client_secret from Stripe");
      }
      return { clientSecret: session.client_secret };
    }

    // Payment mode (addon)
    const addon = ADDON_CONFIG[args.addonKey!];
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
      branding_settings: brandingSettings,
      customer: stripeCustomerId,
      line_items: [{ price: resolvePriceId(prices, args.addonKey!), quantity: 1 }],
      return_url: args.returnUrl,
      metadata: {
        clerkUserId,
        addonKey: args.addonKey!,
        addonCredits: String(addon.credits),
      },
    });

    if (!session.client_secret) {
      throw new Error("Missing client_secret from Stripe");
    }
    return { clientSecret: session.client_secret };
  },
});

export const getCheckoutSessionStatus = action({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = extractClerkUserId(identity);

    const prices = await ctx.runQuery(internal.billing.getActivePrices);
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(args.sessionId);
    const stripeCustomerId = toStripeString(session.customer as string | null);

    // Reconcile billing from the checkout session so credits reflect immediately
    // even if webhook delivery is delayed.
    if (session.status === "complete" && stripeCustomerId) {
      const existingBilling = await ctx.runQuery(internal.billing.getBillingByClerkUserId, {
        clerkUserId,
      });
      if (existingBilling?.stripeCustomerId && existingBilling.stripeCustomerId !== stripeCustomerId) {
        throw new Error("Checkout session customer does not match current user");
      }

      if (session.mode === "subscription" && typeof session.subscription === "string") {
        const subscription = (await stripe.subscriptions.retrieve(
          session.subscription
        )) as unknown as StripeSubscriptionShape;
        const planKey = planKeyFromPriceId(prices,subscription.items.data[0]?.price?.id);
        if (planKey) {
          await upsertFromSubscriptionEvent(ctx, {
            clerkUserId,
            stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            planKey,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start
              ? subscription.current_period_start * 1000
              : undefined,
            currentPeriodEnd: subscription.current_period_end
              ? subscription.current_period_end * 1000
              : undefined,
          });
        }
      }

      if (session.mode === "payment") {
        const addonCredits = Number(session.metadata?.addonCredits ?? "0");
        if (addonCredits > 0) {
          await ctx.runMutation(internal.billing.addAddonCredits, {
            stripeCustomerId,
            clerkUserId,
            credits: addonCredits,
            stripeCheckoutSessionId: session.id,
          });
        }
      }
    }

    return {
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email ?? null,
    };
  },
});
