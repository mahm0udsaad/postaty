import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    // Get all billing records that have a plan (not "none")
    const { data: billingRecords, error } = await admin
      .from("billing")
      .select("*")
      .neq("plan_key", "none")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "[admin/subscriptions] Failed to fetch subscriptions:",
        error
      );
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    const items = billingRecords || [];

    // Enrich with user info
    const authIds = [
      ...new Set(items.map((b) => b.user_auth_id).filter(Boolean)),
    ];
    const { data: users } = await admin
      .from("users")
      .select("auth_id, email, name")
      .in("auth_id", authIds.length > 0 ? authIds : ["__none__"]);

    const usersByAuthId: Record<
      string,
      { email: string; name: string | null }
    > = {};
    for (const u of users || []) {
      usersByAuthId[u.auth_id] = { email: u.email, name: u.name };
    }

    const enrichedSubscriptions = items.map((b) => ({
      ...b,
      user: usersByAuthId[b.user_auth_id] || null,
    }));

    // Summary
    const total = items.length;
    const active = items.filter((b) => b.status === "active").length;
    const trialing = items.filter((b) => b.status === "trialing").length;
    const pastDue = items.filter((b) => b.status === "past_due").length;
    const canceled = items.filter((b) => b.status === "canceled").length;

    return NextResponse.json({
      subscriptions: enrichedSubscriptions,
      summary: {
        total,
        active,
        trialing,
        past_due: pastDue,
        canceled,
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
    console.error("[admin/subscriptions] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
