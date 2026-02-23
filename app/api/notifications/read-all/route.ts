import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

export async function POST() {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();

    const { error } = await admin
      .from("notifications")
      .update({ read_at: Date.now() })
      .eq("user_auth_id", user.id)
      .is("read_at", null);

    if (error) {
      console.error("Failed to mark all notifications as read:", error);
      return NextResponse.json(
        { error: "Failed to mark all notifications as read" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/notifications/read-all error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
