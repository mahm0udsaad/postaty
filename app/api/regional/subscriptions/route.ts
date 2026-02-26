import { NextResponse } from "next/server";
import {
  requireRegionalAccess,
  REGIONAL_COUNTRIES,
} from "@/lib/supabase/regional-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireRegionalAccess();
    const admin = createAdminClient();

    // Get regional user auth_ids
    const { data: regionalUsers } = await admin
      .from("users")
      .select("auth_id, email, name, detected_country")
      .in("detected_country", [...REGIONAL_COUNTRIES]);

    const users = regionalUsers || [];
    const authIds = users.map((u) => u.auth_id);

    // Fetch billing for regional users
    let billingRecords: any[] = [];
    if (authIds.length > 0) {
      const { data } = await admin
        .from("billing")
        .select("*")
        .in("user_auth_id", authIds);
      billingRecords = data || [];
    }

    const userMap: Record<string, (typeof users)[0]> = {};
    for (const u of users) {
      userMap[u.auth_id] = u;
    }

    // Enrich billing with user info
    const enrichedBilling = billingRecords.map((b) => {
      const user = userMap[b.user_auth_id];
      return {
        ...b,
        user_email: user?.email || "Unknown",
        user_name: user?.name || "Unknown",
        user_country: user?.detected_country || "Unknown",
      };
    });

    // Summary
    const active = billingRecords.filter((b) => b.status === "active").length;
    const trialing = billingRecords.filter(
      (b) => b.status === "trialing"
    ).length;
    const canceled = billingRecords.filter(
      (b) => b.status === "canceled"
    ).length;
    const pastDue = billingRecords.filter(
      (b) => b.status === "past_due"
    ).length;

    const byPlan: Record<string, number> = {
      none: 0,
      starter: 0,
      growth: 0,
      dominant: 0,
    };
    for (const b of billingRecords) {
      const key = b.plan_key || "none";
      byPlan[key] = (byPlan[key] || 0) + 1;
    }

    return NextResponse.json({
      subscriptions: enrichedBilling,
      summary: {
        total: billingRecords.length,
        active,
        trialing,
        canceled,
        pastDue,
        byPlan,
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
    console.error("[regional/subscriptions] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
