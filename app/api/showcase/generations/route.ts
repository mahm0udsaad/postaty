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

    // Fetch existing showcase storage_paths to mark already-added outputs
    const { data: showcaseRows } = await admin
      .from("showcase_images")
      .select("storage_path");
    const showcasePaths = new Set(
      (showcaseRows || []).map((r) => r.storage_path)
    );

    // Parse inputs and enrich outputs
    const enriched = (generations || []).map((gen) => {
      let parsedInputs: Record<string, any> = {};
      try {
        parsedInputs =
          typeof gen.inputs === "string"
            ? JSON.parse(gen.inputs)
            : gen.inputs || {};
      } catch {
        parsedInputs = {};
      }

      const outputs = (gen.outputs || []).map((output: any) => {
        // Derive a storage_path from the URL if not present
        let storagePath = output.storage_path || null;
        if (!storagePath && output.url) {
          const match = output.url.match(
            /\/storage\/v1\/object\/public\/generations\/(.+)$/
          );
          if (match) storagePath = match[1];
        }

        return {
          ...output,
          storage_path: storagePath,
          alreadyInShowcase: storagePath
            ? showcasePaths.has(storagePath)
            : false,
        };
      });

      return {
        id: gen.id,
        created_at: gen.created_at,
        category: parsedInputs.category,
        businessName:
          parsedInputs.businessName || parsedInputs.restaurantName || "",
        productName:
          parsedInputs.productName || parsedInputs.mealName || "",
        outputs,
      };
    });

    return NextResponse.json(enriched);
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
