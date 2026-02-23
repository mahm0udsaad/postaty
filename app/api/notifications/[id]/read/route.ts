import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const admin = createAdminClient();

    // Verify the notification belongs to this user
    const { data: notification } = await admin
      .from("notifications")
      .select("id")
      .eq("id", id)
      .eq("user_auth_id", user.id)
      .single();

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const { error } = await admin
      .from("notifications")
      .update({ read_at: Date.now() })
      .eq("id", id);

    if (error) {
      console.error("Failed to mark notification as read:", error);
      return NextResponse.json(
        { error: "Failed to mark notification as read" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/notifications/[id]/read error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
