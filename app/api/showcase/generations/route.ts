import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50"),
      200
    );
    const category = searchParams.get("category");

    let query = admin
      .from("generations")
      .select("id, inputs, outputs, created_at")
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) {
      query = query.like("inputs", `%"category":"${category}"%`);
    }

    const { data: generations, error } = await query;

    if (error) {
      console.error("[showcase/generations] Failed to fetch:", error);
      return NextResponse.json(
        { error: "Failed to fetch generations" },
        { status: 500 }
      );
    }

    return NextResponse.json(generations || []);
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[showcase/generations] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
