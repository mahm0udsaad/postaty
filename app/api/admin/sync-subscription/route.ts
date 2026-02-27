import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const {
      billingId,
      stripeSubscriptionId: providedSubId,
      stripeCustomerId: providedCustomerId,
    } = await request.json();
    if (!billingId) {
      return NextResponse.json({ error: "billingId is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: billing, error } = await admin
      .from("billing")
      .select("*")
      .eq("id", billingId)
      .single();

    if (error || !billing) {
      return NextResponse.json({ error: "Billing record not found" }, { status: 404 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Resolve subscription ID: use existing, then provided sub ID, then look up via customer ID
    let subscriptionId: string | null =
      billing.stripe_subscription_id ?? providedSubId ?? null;

    if (!subscriptionId && providedCustomerId) {
      const list = await stripe.subscriptions.list({
        customer: providedCustomerId,
        limit: 1,
        status: "active",
        expand: ["data.items.data"],
      });
      subscriptionId = list.data[0]?.id ?? null;
    }

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Could not find a Stripe subscription for this record" },
        { status: 400 }
      );
    }

    const subscription = await stripe.subscriptions.retrieve(
      subscriptionId,
      { expand: ["items.data"] }
    );

    // Stripe API 2024-06-20+ moved current_period_start/end to the subscription item level.
    // Fall back to top-level fields for older API versions.
    const item = subscription.items?.data?.[0] as any;
    const rawStart =
      (item?.current_period_start as number | undefined) ??
      (subscription as any).current_period_start;
    const rawEnd =
      (item?.current_period_end as number | undefined) ??
      (subscription as any).current_period_end;

    const currentPeriodStart = rawStart ? rawStart * 1000 : null;
    const currentPeriodEnd = rawEnd ? rawEnd * 1000 : null;

    const stripeCustomerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : (subscription.customer as any)?.id ?? null;

    await admin
      .from("billing")
      .update({
        stripe_subscription_id: subscriptionId,
        ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        status: subscription.status,
        updated_at: Date.now(),
      })
      .eq("id", billingId);

    return NextResponse.json({
      ok: true,
      currentPeriodStart,
      currentPeriodEnd,
      status: subscription.status,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/sync-subscription] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
