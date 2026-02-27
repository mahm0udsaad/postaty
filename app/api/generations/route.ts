import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/lib/supabase/auth-helpers";

export async function GET(request: Request) {
  try {
    const dbUser = await requireCurrentUser();
    const admin = createAdminClient();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status");

    let query = admin
      .from("generations")
      .select("*", { count: "exact" })
      .eq("org_id", dbUser.org_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: generations, error, count } = await query;

    if (error) {
      console.error("Failed to fetch generations:", error);
      return NextResponse.json(
        { error: "Failed to fetch generations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      generations: generations ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("GET /api/generations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const dbUser = await requireCurrentUser();
    const body = await request.json();
    const admin = createAdminClient();

    const {
      category,
      businessName,
      productName,
      inputs,
      creditsCharged,
      brandKitId,
      generationType,
    } = body;

    if (!category) {
      return NextResponse.json(
        { error: "category is required" },
        { status: 400 }
      );
    }

    const { data: generation, error } = await admin
      .from("generations")
      .insert({
        org_id: dbUser.org_id,
        user_id: dbUser.id,
        category,
        business_name: businessName || "",
        product_name: productName || "",
        inputs: inputs || "",
        brand_kit_id: brandKitId || null,
        generation_type: generationType || "poster",
        credits_charged: creditsCharged ?? 1,
        status: "processing",
        created_at: Date.now(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create generation:", error);
      return NextResponse.json(
        { error: "Failed to create generation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: generation.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("POST /api/generations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
