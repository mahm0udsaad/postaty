import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbUser = await requireCurrentUser();
    const admin = createAdminClient();

    const { data: job, error } = await admin
      .from("poster_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.org_id !== dbUser.org_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("GET /api/poster-jobs/[id] error:", error);
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
    const admin = createAdminClient();

    // Fetch the existing job
    const { data: job, error: fetchError } = await admin
      .from("poster_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.org_id !== dbUser.org_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Pattern 1: Update job status
    if (body.status !== undefined && body.designIndex === undefined && body.designsJson === undefined) {
      const updates: Record<string, unknown> = { status: body.status };
      if (body.error !== undefined) {
        updates.error = body.error;
      }
      if (body.status === "complete" || body.status === "error") {
        updates.completed_at = Date.now();
      }

      const { error } = await admin
        .from("poster_jobs")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("Failed to update poster job status:", error);
        return NextResponse.json(
          { error: "Failed to update job status" },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Pattern 2: Save designs JSON, set status to "rendering"
    if (body.designsJson !== undefined) {
      const { error } = await admin
        .from("poster_jobs")
        .update({
          designs_json: body.designsJson,
          status: "rendering",
        })
        .eq("id", id);

      if (error) {
        console.error("Failed to save designs JSON:", error);
        return NextResponse.json(
          { error: "Failed to save designs" },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Pattern 3: Update a single result in the results array
    if (body.designIndex !== undefined) {
      const results = ((job.results as unknown[]) || []).map((r: unknown) => {
        const result = r as Record<string, unknown>;
        if (result.designIndex === body.designIndex) {
          return {
            ...result,
            status: body.resultStatus || result.status,
            ...(body.storageUrl !== undefined && { storageUrl: body.storageUrl }),
            ...(body.error !== undefined && { error: body.error }),
          };
        }
        return result;
      });

      const completedDesigns = results.filter((r: unknown) => {
        const result = r as Record<string, unknown>;
        return result.status === "complete" || result.status === "error";
      }).length;

      const allDone = completedDesigns === job.total_designs;

      const updates: Record<string, unknown> = {
        results,
        completed_designs: completedDesigns,
      };

      if (allDone) {
        updates.status = "complete";
        updates.completed_at = Date.now();
      }

      const { error } = await admin
        .from("poster_jobs")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("Failed to update poster job result:", error);
        return NextResponse.json(
          { error: "Failed to update result" },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, completedDesigns, allDone });
    }

    return NextResponse.json(
      { error: "Invalid update pattern" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("PATCH /api/poster-jobs/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
