import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

export async function GET() {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();

    const { data: notifications, error } = await admin
      .from("notifications")
      .select("id, type, title, body, is_read, metadata, created_at")
      .eq("user_auth_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to fetch notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    const unreadCount = (notifications ?? []).filter(
      (n) => !n.is_read
    ).length;

    const res = NextResponse.json({
      notifications: notifications ?? [],
      unreadCount,
    });
    res.headers.set("Cache-Control", "private, max-age=5, stale-while-revalidate=15");
    return res;
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
