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

    // Allow access to system templates (org_id is null) or user's own org templates
    const { data: template, error } = await admin
      .from("templates")
      .select("*")
      .eq("id", id)
      .or(`org_id.is.null,org_id.eq.${dbUser.org_id}`)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("GET /api/templates/[id] error:", error);
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

    // Only allow editing org-owned templates (not system templates)
    const { data: existing } = await admin
      .from("templates")
      .select("id, org_id")
      .eq("id", id)
      .eq("org_id", dbUser.org_id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found or not editable" },
        { status: 404 }
      );
    }

    const allowedFields = [
      "name",
      "description",
      "prompt_template",
      "thumbnail_url",
      "category",
      "format",
      "settings",
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

    const { data: template, error } = await admin
      .from("templates")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to update template:", error);
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("PATCH /api/templates/[id] error:", error);
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

    // Only allow deleting org-owned templates (not system templates)
    const { data: existing } = await admin
      .from("templates")
      .select("id, org_id")
      .eq("id", id)
      .eq("org_id", dbUser.org_id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found or not deletable" },
        { status: 404 }
      );
    }

    const { error } = await admin
      .from("templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete template:", error);
      return NextResponse.json(
        { error: "Failed to delete template" },
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
    console.error("DELETE /api/templates/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
