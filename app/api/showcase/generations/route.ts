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
    const offset = parseInt(searchParams.get("offset") || "0");
    const category = searchParams.get("category");

    let query = admin
      .from("generations")
      .select("id, business_name, product_name, category, outputs, created_at", { count: "exact" })
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    const [{ data: generations, error, count }, { data: showcaseRows }] = await Promise.all([
      query,
      admin.from("showcase_images").select("storage_path"),
    ]);

    if (error) {
      console.error("[showcase/generations] Failed to fetch:", error);
      return NextResponse.json(
        { error: "Failed to fetch generations" },
        { status: 500 }
      );
    }

    const showcaseUrls = new Set((showcaseRows ?? []).map((r) => r.storage_path));

    const result = (generations ?? []).map((gen) => ({
      id: gen.id,
      businessName: gen.business_name,
      productName: gen.product_name,
      category: gen.category,
      created_at: gen.created_at,
      outputs: ((gen.outputs as any[]) ?? []).map((o) => ({
        ...o,
        alreadyInShowcase: !!o.url && showcaseUrls.has(o.url),
      })),
    }));

    return NextResponse.json({ items: result, total: count ?? 0, offset, limit });
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
