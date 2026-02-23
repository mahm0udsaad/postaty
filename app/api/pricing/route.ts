import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const US_COUNTRY_CODE = "US";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get("countryCode");

    if (!countryCode) {
      return NextResponse.json(
        { error: "countryCode query parameter is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Look up country-specific pricing
    const { data: prices, error } = await admin
      .from("country_pricing")
      .select("*")
      .eq("country_code", countryCode.toUpperCase())
      .eq("is_active", true)
      .order("plan_key");

    if (error) {
      console.error("[pricing] Failed to fetch country pricing:", error);
      return NextResponse.json(
        { error: "Failed to fetch pricing" },
        { status: 500 }
      );
    }

    // If results found for the requested country, return them
    if (prices && prices.length > 0) {
      return NextResponse.json({ prices });
    }

    // Fall back to US pricing
    const { data: usPrices, error: usError } = await admin
      .from("country_pricing")
      .select("*")
      .eq("country_code", US_COUNTRY_CODE)
      .eq("is_active", true)
      .order("plan_key");

    if (usError) {
      console.error("[pricing] Failed to fetch US fallback pricing:", usError);
      return NextResponse.json(
        { error: "Failed to fetch pricing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prices: usPrices || [] });
  } catch (error) {
    console.error("[pricing] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
