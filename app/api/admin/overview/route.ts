import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const periodDays = parseInt(searchParams.get("periodDays") || "30");
    const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;

    // AI metrics
    const { data: aiEvents } = await admin
      .from("ai_usage_events")
      .select("*")
      .gte("created_at", cutoff);

    const periodEvents = aiEvents || [];
    const byModel: Record<
      string,
      {
        count: number;
        cost: number;
        images: number;
        totalDuration: number;
        avgDurationMs: number;
      }
    > = {};

    for (const e of periodEvents) {
      if (!byModel[e.model]) {
        byModel[e.model] = {
          count: 0,
          cost: 0,
          images: 0,
          totalDuration: 0,
          avgDurationMs: 0,
        };
      }
      byModel[e.model].count++;
      byModel[e.model].cost += Number(e.estimated_cost_usd);
      byModel[e.model].images += Number(e.images_generated);
      byModel[e.model].totalDuration += Number(e.duration_ms);
    }
    for (const key of Object.keys(byModel)) {
      byModel[key].avgDurationMs =
        byModel[key].count > 0
          ? byModel[key].totalDuration / byModel[key].count
          : 0;
    }

    const totalRequests = periodEvents.length;
    const successCount = periodEvents.filter((e) => e.success).length;
    const failureCount = totalRequests - successCount;
    const totalCostUsd = periodEvents.reduce(
      (sum, e) => sum + Number(e.estimated_cost_usd),
      0
    );
    const totalImages = periodEvents.reduce(
      (sum, e) => sum + Number(e.images_generated),
      0
    );

    // Financial metrics
    const { data: revenueEvents } = await admin
      .from("stripe_revenue_events")
      .select("*")
      .gte("created_at", cutoff);

    const usdRevenue = (revenueEvents || []).filter(
      (e) => e.currency === "USD"
    );
    const grossRevenue =
      usdRevenue.reduce((sum, e) => sum + e.amount_cents, 0) / 100;
    const stripeFees =
      usdRevenue.reduce(
        (sum, e) =>
          sum + (e.actual_stripe_fee_cents ?? e.estimated_stripe_fee_cents),
        0
      ) / 100;
    const hasActualFees = usdRevenue.some(
      (e) => e.actual_stripe_fee_cents != null
    );
    const apiCostUsd = totalCostUsd;
    const netProfit = grossRevenue - stripeFees - apiCostUsd;

    // Total users count
    const { count: totalUsers } = await admin
      .from("users")
      .select("id", { count: "exact", head: true });

    // Active subscriptions
    const { data: allBilling } = await admin.from("billing").select("*");
    const activeSubs = (allBilling || []).filter(
      (b) => b.status === "active" || b.status === "trialing"
    );

    // MRR from country pricing (use US pricing as baseline)
    const { data: countryPrices } = await admin
      .from("country_pricing")
      .select("*")
      .eq("country_code", "US")
      .eq("is_active", true);

    const planPricing: Record<string, number> = { none: 0 };
    for (const cp of countryPrices || []) {
      planPricing[cp.plan_key] = cp.monthly_amount_cents / 100;
    }
    const mrr = activeSubs.reduce(
      (sum, b) => sum + (planPricing[b.plan_key] ?? 0),
      0
    );

    return NextResponse.json({
      ai: {
        periodDays,
        totalRequests,
        successCount,
        failureCount,
        successRate: totalRequests > 0 ? successCount / totalRequests : 0,
        totalCostUsd,
        totalImages,
        byModel,
      },
      financial: {
        periodDays,
        grossRevenue,
        stripeFees,
        hasActualFees,
        apiCostUsd,
        netProfit,
        totalUsers: totalUsers ?? 0,
        activeSubscriptions: activeSubs.length,
        subscriptionsByPlan: {
          starter: activeSubs.filter((b) => b.plan_key === "starter").length,
          growth: activeSubs.filter((b) => b.plan_key === "growth").length,
          dominant: activeSubs.filter((b) => b.plan_key === "dominant").length,
        },
        mrr,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    console.error("[admin/overview] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
