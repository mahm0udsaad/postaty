import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/lib/supabase/auth-helpers";

// Map snake_case DB row → camelCase for frontend
function toFrontend(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_storage_path ?? null,
    instructions: row.instructions ?? null,
    palette: row.palette ?? null,
    extractedColors: row.extracted_colors ?? [],
    fontFamily: row.font_family ?? null,
    styleAdjectives: row.style_adjectives ?? [],
    doRules: row.do_rules ?? [],
    dontRules: row.dont_rules ?? [],
    styleSeed: row.style_seed ?? null,
    isDefault: row.is_default ?? false,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    const dbUser = await requireCurrentUser();
    const admin = createAdminClient();

    const { data: brandKits, error } = await admin
      .from("brand_kits")
      .select("*")
      .eq("org_id", dbUser.org_id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch brand kits:", error);
      return NextResponse.json(
        { error: "Failed to fetch brand kits" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      brandKits: (brandKits ?? []).map(toFrontend),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("GET /api/brand-kits error:", error);
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

    const {
      id,
      name,
      logoUrl,
      instructions,
      palette,
      extractedColors,
      fontFamily,
      styleAdjectives,
      doRules,
      dontRules,
      isDefault,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const now = Date.now();

    const row = {
      org_id: dbUser.org_id,
      name,
      logo_storage_path: logoUrl || null,
      instructions: instructions || null,
      palette: palette || null,
      extracted_colors: extractedColors || [],
      font_family: fontFamily || null,
      style_adjectives: styleAdjectives || [],
      do_rules: doRules || [],
      dont_rules: dontRules || [],
      is_default: isDefault ?? false,
      updated_at: now,
    };

    let result;

    if (id) {
      // Update existing
      const { data, error } = await admin
        .from("brand_kits")
        .update(row)
        .eq("id", id)
        .eq("org_id", dbUser.org_id)
        .select("*")
        .single();

      if (error) {
        console.error("Failed to update brand kit:", error);
        return NextResponse.json(
          { error: "Failed to update brand kit" },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Insert new
      const { data, error } = await admin
        .from("brand_kits")
        .insert(row)
        .select("*")
        .single();

      if (error) {
        console.error("Failed to create brand kit:", error);
        return NextResponse.json(
          { error: "Failed to create brand kit" },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json(
      { brandKit: toFrontend(result) },
      { status: id ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("POST /api/brand-kits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
