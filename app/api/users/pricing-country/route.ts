import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

export async function PUT(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { detected_country, pricing_country, country_source } = body;

    if (!detected_country || !pricing_country || !country_source) {
      return NextResponse.json(
        {
          error:
            "detected_country, pricing_country, and country_source are required",
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: dbUser, error } = await admin
      .from("users")
      .update({
        detected_country,
        pricing_country,
        country_source,
        country_locked_at: Date.now(),
      })
      .eq("auth_id", user.id)
      .select(
        "id, detected_country, pricing_country, country_source, country_locked_at"
      )
      .single();

    if (error) {
      console.error("Pricing country update error:", error);
      return NextResponse.json(
        { error: "Failed to update pricing country" },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("PUT /api/users/pricing-country error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
