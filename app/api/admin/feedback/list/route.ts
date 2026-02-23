import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100"),
      500
    );
    const ratingFilter = searchParams.get("rating");

    let query = admin
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (ratingFilter) {
      query = query.eq("rating", ratingFilter);
    }

    const { data: feedbackItems, error } = await query;

    if (error) {
      console.error("[admin/feedback/list] Failed to fetch feedback:", error);
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 }
      );
    }

    const items = feedbackItems || [];

    // Enrich with user info
    const authIds = [
      ...new Set(items.map((f) => f.user_auth_id).filter(Boolean)),
    ];
    const { data: users } = await admin
      .from("users")
      .select("auth_id, email, name")
      .in("auth_id", authIds.length > 0 ? authIds : ["__none__"]);

    const usersByAuthId: Record<string, { email: string; name: string | null }> = {};
    for (const u of users || []) {
      usersByAuthId[u.auth_id] = { email: u.email, name: u.name };
    }

    const enrichedFeedback = items.map((f) => {
      const user = usersByAuthId[f.user_auth_id];
      return {
        ...f,
        user_name: user?.name || "Unknown",
        user_email: user?.email || "",
      };
    });

    return NextResponse.json(enrichedFeedback);
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/feedback/list] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
