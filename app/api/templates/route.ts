import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/lib/supabase/auth-helpers";

export async function GET() {
  try {
    const dbUser = await requireCurrentUser();
    const admin = createAdminClient();

    // Fetch system templates (org_id is null) + user's org templates
    const { data: templates, error } = await admin
      .from("templates")
      .select("*")
      .or(`org_id.is.null,org_id.eq.${dbUser.org_id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates ?? [] });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("GET /api/templates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
