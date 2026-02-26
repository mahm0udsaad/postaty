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
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100"),
      500
    );

    // Fetch regional users
    const { data: users, error: usersError } = await admin
      .from("users")
      .select("*")
      .in("detected_country", [...REGIONAL_COUNTRIES])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (usersError) {
      console.error("[regional/users] Failed to fetch users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Enrich with billing
    const authIds = (users || []).map((u) => u.auth_id);
    let billingRecords: any[] = [];
    if (authIds.length > 0) {
      const { data } = await admin
        .from("billing")
        .select("*")
        .in("user_auth_id", authIds);
      billingRecords = data || [];
    }

    const billingByAuthId: Record<string, any> = {};
    for (const b of billingRecords) {
      billingByAuthId[b.user_auth_id] = b;
    }

    const enrichedUsers = (users || []).map((u) => ({
      ...u,
      billing: billingByAuthId[u.auth_id] || null,
    }));

    return NextResponse.json({
      users: enrichedUsers,
      total: enrichedUsers.length,
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
    console.error("[regional/users] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
