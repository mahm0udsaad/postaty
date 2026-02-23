import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { business_name, business_category, brand_colors } = body;

    if (!business_name || !business_category) {
      return NextResponse.json(
        { error: "business_name and business_category are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: dbUser, error } = await admin
      .from("users")
      .update({
        business_name,
        business_category,
        brand_colors: brand_colors || null,
        onboarded: true,
      })
      .eq("auth_id", user.id)
      .select("id, business_name, business_category, brand_colors, onboarded")
      .single();

    if (error) {
      console.error("Onboarding update error:", error);
      return NextResponse.json(
        { error: "Failed to complete onboarding" },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/users/onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
