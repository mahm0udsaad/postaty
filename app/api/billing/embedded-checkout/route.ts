import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";
import { getRegionForCountry } from "@/lib/country-pricing";

type PlanKey = "starter" | "growth" | "dominant";
type AddonKey = "addon_5" | "addon_10";
type CheckoutTheme = "dark" | "light";

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

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();
    const body = await request.json();
    const { planKey, addonKey, couponId, theme, returnUrl, countryCode } = body as {
      planKey?: PlanKey;
      addonKey?: AddonKey;
      couponId?: string;
      theme?: CheckoutTheme;
      returnUrl: string;
      countryCode?: string;
    };

    // Determine regional pricing group from country
    const region = getRegionForCountry(countryCode);

    if (!planKey && !addonKey) {
      return NextResponse.json(
        { error: "Must specify either planKey or addonKey" },
        { status: 400 }
      );
    }

    if (!returnUrl) {
      return NextResponse.json(
        { error: "returnUrl is required" },
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
    const brandingSettings = getCheckoutBrandingSettings(theme ?? "dark");

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

    // Subscription embedded checkout
    if (planKey) {
      // Try regional price first (e.g. "starter:mena_local"), fall back to default
      const regionalKey = region ? `${planKey}:${region}` : null;
      const priceId = (regionalKey && prices[regionalKey]) || prices[planKey];
      if (!priceId) {
        return NextResponse.json(
          { error: `No active Stripe price configured for "${planKey}"` },
          { status: 400 }
        );
      }

      const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];

      // Skip first-month discount for regional pricing (already discounted)
      if (couponId) {
        discounts.push({ coupon: couponId });
      } else if (!region) {
        const discountCents = PLAN_CONFIG[planKey].firstMonthDiscountCents;
        if (discountCents > 0) {
          const coupon = await stripe.coupons.create({
            duration: "once",
            amount_off: discountCents,
            currency: "usd",
            name: `First month ${planKey}`,
            metadata: { userAuthId: user.id, planKey },
          });
          discounts.push({ coupon: coupon.id });
        }
      }

      const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded",
        mode: "subscription",
        branding_settings: brandingSettings,
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        ...(discounts.length > 0 ? { discounts } : {}),
        return_url: returnUrl,
        metadata: { userAuthId: user.id, planKey },
        subscription_data: {
          metadata: { userAuthId: user.id, planKey },
        },
      });

      if (!session.client_secret) {
        return NextResponse.json(
          { error: "Missing client_secret from Stripe" },
          { status: 500 }
        );
      }

      return NextResponse.json({ clientSecret: session.client_secret });
    }

    // Addon embedded checkout
    const priceId = prices[addonKey!];
    if (!priceId) {
      return NextResponse.json(
        { error: `No active Stripe price configured for "${addonKey}"` },
        { status: 400 }
      );
    }

    const addon = ADDON_CONFIG[addonKey!];
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
      branding_settings: brandingSettings,
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: returnUrl,
      metadata: {
        userAuthId: user.id,
        addonKey: addonKey!,
        addonCredits: String(addon.credits),
      },
    });

    if (!session.client_secret) {
      return NextResponse.json(
        { error: "Missing client_secret from Stripe" },
        { status: 500 }
      );
    }

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/billing/embedded-checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
