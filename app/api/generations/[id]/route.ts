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

    const { data: generation, error } = await admin
      .from("generations")
      .select("*")
      .eq("id", id)
      .eq("org_id", dbUser.org_id)
      .single();

    if (error || !generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ generation });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("GET /api/generations/[id] error:", error);
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

    // Verify ownership and get current data
    const { data: existing } = await admin
      .from("generations")
      .select("id, outputs")
      .eq("id", id)
      .eq("org_id", dbUser.org_id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    const { action } = body;
    const updates: Record<string, unknown> = {};

    if (action === "updateOutput") {
      // Append an output entry to the outputs jsonb array
      const { format, imageUrl, width, height } = body;
      const currentOutputs = (existing.outputs as unknown[]) || [];
      updates.outputs = [
        ...currentOutputs,
        { format, url: imageUrl, width, height },
      ];
    } else if (action === "updateStatus") {
      const { status, durationMs } = body;
      if (status) updates.status = status;
      if (durationMs != null) updates.duration_ms = durationMs;
    } else {
      // Fallback: allow direct field updates for known columns
      const allowedFields = [
        "status",
        "outputs",
        "prompt_used",
        "error",
        "duration_ms",
      ];
      for (const field of allowedFields) {
        if (field in body) {
          updates[field] = body[field];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: generation, error } = await admin
      .from("generations")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to update generation:", error);
      return NextResponse.json(
        { error: "Failed to update generation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ generation });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("PATCH /api/generations/[id] error:", error);
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
      .from("generations")
      .select("id")
      .eq("id", id)
      .eq("org_id", dbUser.org_id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    const { error } = await admin
      .from("generations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete generation:", error);
      return NextResponse.json(
        { error: "Failed to delete generation" },
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
    console.error("DELETE /api/generations/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
