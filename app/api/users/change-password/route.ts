import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // Verify user signed up with email (not OAuth-only)
    const isEmailProvider =
      user.app_metadata?.provider === "email" ||
      user.identities?.some((i) => i.provider === "email");

    if (!isEmailProvider) {
      return NextResponse.json(
        { error: "Password change is only available for email accounts" },
        { status: 400 }
      );
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("[users/change-password] Error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to change password" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    console.error("[users/change-password] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
