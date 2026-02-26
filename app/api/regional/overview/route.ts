import { NextResponse } from "next/server";
import {
  requireRegionalAccess,
  REGIONAL_COUNTRIES,
} from "@/lib/supabase/regional-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireRegionalAccess();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const periodDays = parseInt(searchParams.get("periodDays") || "30");
    const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;

    // 1. Get regional users
    const { data: regionalUsers } = await admin
      .from("users")
      .select(
        "id, auth_id, email, name, detected_country, pricing_country, status, created_at"
      )
      .in("detected_country", [...REGIONAL_COUNTRIES]);

    const users = regionalUsers || [];
    const authIds = users.map((u) => u.auth_id);
    const userIds = users.map((u) => u.id);

    // Users stats
    const totalUsers = users.length;
    const newUsers = users.filter((u) => u.created_at >= cutoff).length;
    const activeUsers = users.filter((u) => u.status === "active").length;

    const byCountry: Record<string, number> = { JO: 0, PS: 0, IL: 0 };
    for (const u of users) {
      const c = u.detected_country;
      if (c && c in byCountry) byCountry[c]++;
    }

    // Signup trend (last N days grouped by day)
    const signupTrend: Record<string, number> = {};
    for (const u of users) {
      if (u.created_at >= cutoff) {
        const day = new Date(u.created_at).toISOString().split("T")[0];
        signupTrend[day] = (signupTrend[day] || 0) + 1;
      }
    }

    // 2. Billing / Subscriptions
    let billingRecords: any[] = [];
    if (authIds.length > 0) {
      const { data } = await admin
        .from("billing")
        .select("*")
        .in("user_auth_id", authIds);
      billingRecords = data || [];
    }

    const activeSubs = billingRecords.filter(
      (b) => b.status === "active" || b.status === "trialing"
    );
    const subscriptionsByPlan = {
      starter: activeSubs.filter((b) => b.plan_key === "starter").length,
      growth: activeSubs.filter((b) => b.plan_key === "growth").length,
      dominant: activeSubs.filter((b) => b.plan_key === "dominant").length,
    };
    const trialingSubs = billingRecords.filter(
      (b) => b.status === "trialing"
    ).length;
    const canceledSubs = billingRecords.filter(
      (b) => b.status === "canceled"
    ).length;

    // Plan distribution (including free/none)
    const planDistribution: Record<string, number> = {
      none: 0,
      starter: 0,
      growth: 0,
      dominant: 0,
    };
    for (const b of billingRecords) {
      const key = b.plan_key || "none";
      planDistribution[key] = (planDistribution[key] || 0) + 1;
    }
    // Users without billing records are on "none"
    planDistribution["none"] += Math.max(
      0,
      totalUsers - billingRecords.length
    );

    // 3. Generations
    let generations: any[] = [];
    if (userIds.length > 0) {
      const { data } = await admin
        .from("generations")
        .select(
          "id, user_id, category, status, credits_charged, created_at"
        )
        .in("user_id", userIds);
      generations = data || [];
    }

    const totalGenerations = generations.length;
    const completedGenerations = generations.filter(
      (g) => g.status === "complete"
    ).length;
    const failedGenerations = generations.filter(
      (g) => g.status === "failed"
    ).length;
    const totalCreditsUsed = generations.reduce(
      (sum, g) => sum + (g.credits_charged || 0),
      0
    );

    const byCategory: Record<string, number> = {};
    for (const g of generations) {
      byCategory[g.category] = (byCategory[g.category] || 0) + 1;
    }

    // Recent generations (last 10)
    const recentGenerations = generations
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 10)
      .map((g) => {
        const user = users.find((u) => u.id === g.user_id);
        return {
          id: g.id,
          category: g.category,
          status: g.status,
          credits_charged: g.credits_charged,
          created_at: g.created_at,
          user_name: user?.name || "Unknown",
          user_email: user?.email || "Unknown",
        };
      });

    return NextResponse.json({
      periodDays,
      users: {
        total: totalUsers,
        new: newUsers,
        active: activeUsers,
        byCountry,
        signupTrend,
      },
      subscriptions: {
        active: activeSubs.length,
        trialing: trialingSubs,
        canceled: canceledSubs,
        byPlan: subscriptionsByPlan,
        planDistribution,
      },
      generations: {
        total: totalGenerations,
        completed: completedGenerations,
        failed: failedGenerations,
        totalCreditsUsed,
        byCategory,
        recent: recentGenerations,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "Regional access required") {
      return NextResponse.json(
        { error: "Regional access required" },
        { status: 403 }
      );
    }
    console.error("[regional/overview] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
