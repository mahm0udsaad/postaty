import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "0");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = page * limit;

    const adminFilter = searchParams.get("admin_id");
    const actionFilter = searchParams.get("action");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    // Build query
    let query = admin
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (adminFilter) {
      query = query.eq("user_id", adminFilter);
    }
    if (actionFilter) {
      query = query.eq("action", actionFilter);
    }
    if (dateFrom) {
      query = query.gte("created_at", parseInt(dateFrom));
    }
    if (dateTo) {
      query = query.lte("created_at", parseInt(dateTo));
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error("[admin/activity] Failed to fetch logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch activity logs" },
        { status: 500 }
      );
    }

    // Collect user IDs for enrichment
    const adminIds = [
      ...new Set((logs || []).map((l) => l.user_id).filter(Boolean)),
    ];
    const targetUserIds = [
      ...new Set(
        (logs || [])
          .filter((l) => l.resource_type === "user")
          .map((l) => l.resource_id)
          .filter(Boolean)
      ),
    ];
    const allUserIds = [...new Set([...adminIds, ...targetUserIds])];

    // Fetch user names
    const { data: users } = await admin
      .from("users")
      .select("id, name, email, role")
      .in("id", allUserIds.length > 0 ? allUserIds : ["__none__"]);

    const usersById: Record<
      string,
      { name: string; email: string; role: string }
    > = {};
    for (const u of users || []) {
      usersById[u.id] = { name: u.name, email: u.email, role: u.role };
    }

    // Resolve billing resource_ids to user names
    const billingIds = [
      ...new Set(
        (logs || [])
          .filter((l) => l.resource_type === "billing")
          .map((l) => l.resource_id)
          .filter(Boolean)
      ),
    ];
    const billingUserMap: Record<string, string> = {};
    if (billingIds.length > 0) {
      const { data: billingRecords } = await admin
        .from("billing")
        .select("id, user_auth_id")
        .in("id", billingIds);

      if (billingRecords && billingRecords.length > 0) {
        const authIds = billingRecords.map((b) => b.user_auth_id);
        const { data: billingUsers } = await admin
          .from("users")
          .select("auth_id, name")
          .in("auth_id", authIds);

        const nameByAuthId: Record<string, string> = {};
        for (const u of billingUsers || []) {
          nameByAuthId[u.auth_id] = u.name;
        }
        for (const b of billingRecords) {
          billingUserMap[b.id] = nameByAuthId[b.user_auth_id] || "Unknown";
        }
      }
    }

    // Enrich logs
    const enrichedLogs = (logs || []).map((log) => ({
      ...log,
      admin_name: usersById[log.user_id]?.name || "Unknown",
      admin_email: usersById[log.user_id]?.email || "",
      target_name:
        log.resource_type === "user"
          ? usersById[log.resource_id]?.name || log.resource_id
          : log.resource_type === "billing"
            ? billingUserMap[log.resource_id] || log.resource_id
            : log.resource_id,
      parsed_metadata: (() => {
        try {
          return JSON.parse(log.metadata);
        } catch {
          return null;
        }
      })(),
    }));

    // Get admin users for filter dropdown
    const { data: adminUsers } = await admin
      .from("users")
      .select("id, name, email, role")
      .in("role", ["admin", "owner"]);

    // Get distinct action types
    const { data: actionTypes } = await admin
      .from("audit_logs")
      .select("action")
      .limit(1000);
    const uniqueActions = [
      ...new Set((actionTypes || []).map((a) => a.action)),
    ].sort();

    return NextResponse.json({
      logs: enrichedLogs,
      total: count || 0,
      page,
      limit,
      adminUsers: adminUsers || [],
      actionTypes: uniqueActions,
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
    console.error("[admin/activity] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
