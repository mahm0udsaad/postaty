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

    // Get regional user IDs
    const { data: regionalUsers } = await admin
      .from("users")
      .select("id, auth_id, email, name, detected_country")
      .in("detected_country", [...REGIONAL_COUNTRIES]);

    const users = regionalUsers || [];
    const userIds = users.map((u) => u.id);

    // Fetch generations
    let allGenerations: any[] = [];
    if (userIds.length > 0) {
      const { data } = await admin
        .from("generations")
        .select("*")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });
      allGenerations = data || [];
    }

    // Period filter
    const periodGenerations = allGenerations.filter(
      (g) => g.created_at >= cutoff
    );

    // Summary stats
    const totalAll = allGenerations.length;
    const totalPeriod = periodGenerations.length;
    const completed = periodGenerations.filter(
      (g) => g.status === "complete"
    ).length;
    const failed = periodGenerations.filter(
      (g) => g.status === "failed"
    ).length;
    const totalCredits = periodGenerations.reduce(
      (sum, g) => sum + (g.credits_charged || 0),
      0
    );

    // By category
    const byCategory: Record<string, number> = {};
    for (const g of periodGenerations) {
      byCategory[g.category] = (byCategory[g.category] || 0) + 1;
    }

    // By generation type
    const byType: Record<string, number> = { poster: 0, reel: 0, menu: 0 };
    for (const g of periodGenerations) {
      const t = g.generation_type || "poster";
      byType[t] = (byType[t] || 0) + 1;
    }

    // Daily trend
    const dailyTrend: Record<string, number> = {};
    for (const g of periodGenerations) {
      const day = new Date(g.created_at).toISOString().split("T")[0];
      dailyTrend[day] = (dailyTrend[day] || 0) + 1;
    }

    // User map for enrichment
    const userMap: Record<string, (typeof users)[0]> = {};
    for (const u of users) {
      userMap[u.id] = u;
    }

    // Recent generations (last 20)
    const recent = allGenerations.slice(0, 20).map((g) => {
      const user = userMap[g.user_id];
      return {
        id: g.id,
        category: g.category,
        generation_type: g.generation_type || "poster",
        business_name: g.business_name,
        product_name: g.product_name,
        status: g.status,
        credits_charged: g.credits_charged,
        created_at: g.created_at,
        user_name: user?.name || "Unknown",
        user_email: user?.email || "Unknown",
      };
    });

    return NextResponse.json({
      periodDays,
      summary: {
        totalAll,
        totalPeriod,
        completed,
        failed,
        totalCredits,
      },
      byCategory,
      byType,
      dailyTrend,
      recent,
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
    console.error("[regional/generations] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
