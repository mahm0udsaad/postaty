import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/lib/supabase/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbUser = await requireCurrentUser();
    const admin = createAdminClient();

    const { data: brandKit, error } = await admin
      .from("brand_kits")
      .select("*")
      .eq("id", id)
      .eq("org_id", dbUser.org_id)
      .single();

    if (error || !brandKit) {
      return NextResponse.json(
        { error: "Brand kit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ brandKit });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("GET /api/brand-kits/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbUser = await requireCurrentUser();
    const body = await request.json();
    const admin = createAdminClient();

    // Verify ownership
    const { data: existing } = await admin
      .from("brand_kits")
      .select("id")
      .eq("id", id)
      .eq("org_id", dbUser.org_id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Brand kit not found" },
        { status: 404 }
      );
    }

    const allowedFields = [
      "name",
      "logo_url",
      "primary_color",
      "secondary_color",
      "accent_color",
      "fonts",
      "metadata",
    ];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: brandKit, error } = await admin
      .from("brand_kits")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to update brand kit:", error);
      return NextResponse.json(
        { error: "Failed to update brand kit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ brandKit });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("PATCH /api/brand-kits/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbUser = await requireCurrentUser();
    const admin = createAdminClient();

    // Verify ownership
    const { data: existing } = await admin
      .from("brand_kits")
      .select("id")
      .eq("id", id)
      .eq("org_id", dbUser.org_id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Brand kit not found" },
        { status: 404 }
      );
    }

    const { error } = await admin
      .from("brand_kits")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete brand kit:", error);
      return NextResponse.json(
        { error: "Failed to delete brand kit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("DELETE /api/brand-kits/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
