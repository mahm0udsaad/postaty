import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const dbUser = await requireCurrentUser();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

    const { data: jobs, error } = await admin
      .from("poster_jobs")
      .select("*")
      .eq("org_id", dbUser.org_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch poster jobs:", error);
      return NextResponse.json(
        { error: "Failed to fetch poster jobs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobs: jobs ?? [] });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("GET /api/poster-jobs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const dbUser = await requireCurrentUser();
    const admin = createAdminClient();
    const body = await request.json();

    const { category, formDataJson, format, totalDesigns } = body;

    if (!category || !formDataJson || !totalDesigns) {
      return NextResponse.json(
        { error: "Missing required fields: category, formDataJson, totalDesigns" },
        { status: 400 }
      );
    }

    const results = Array.from({ length: totalDesigns }, (_, i) => ({
      designIndex: i,
      format: format || "square",
      status: "pending",
    }));

    const { data: job, error } = await admin
      .from("poster_jobs")
      .insert({
        org_id: dbUser.org_id,
        user_id: dbUser.id,
        category,
        form_data_json: formDataJson,
        status: "pending",
        results,
        total_designs: totalDesigns,
        completed_designs: 0,
        started_at: Date.now(),
        created_at: Date.now(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create poster job:", error);
      return NextResponse.json(
        { error: "Failed to create poster job" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: job.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("POST /api/poster-jobs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
