import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// GET — List country pricing from country_pricing table
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: pricing, error } = await admin
      .from("country_pricing")
      .select("*")
      .order("country_code");

    if (error) {
      console.error("[admin/stripe/country-pricing] Failed to fetch country pricing:", error);
      return NextResponse.json(
        { error: "Failed to fetch country pricing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ countryPricing: pricing });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/stripe/country-pricing] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Update country pricing
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      // =====================================================================
      // update_country_pricing — Upsert country pricing
      // =====================================================================
      case "update_country_pricing": {
        const {
          countryCode,
          planKey,
          currency,
          currencySymbol,
          monthlyAmountCents,
          firstMonthAmountCents,
          isActive,
        } = body as {
          countryCode: string;
          planKey: string;
          currency: string;
          currencySymbol: string;
          monthlyAmountCents: number;
          firstMonthAmountCents: number;
          isActive: boolean;
        };

        if (
          !countryCode ||
          !planKey ||
          !currency ||
          !currencySymbol ||
          monthlyAmountCents === undefined ||
          firstMonthAmountCents === undefined ||
          isActive === undefined
        ) {
          return NextResponse.json(
            {
              error:
                "countryCode, planKey, currency, currencySymbol, monthlyAmountCents, firstMonthAmountCents, and isActive are required",
            },
            { status: 400 }
          );
        }

        const now = Date.now();

        // Check if a row exists for this country_code + plan_key
        const { data: existing } = await admin
          .from("country_pricing")
          .select("id")
          .eq("country_code", countryCode)
          .eq("plan_key", planKey)
          .maybeSingle();

        if (existing) {
          // Update
          const { error } = await admin
            .from("country_pricing")
            .update({
              currency,
              currency_symbol: currencySymbol,
              monthly_amount_cents: monthlyAmountCents,
              first_month_amount_cents: firstMonthAmountCents,
              is_active: isActive,
              updated_at: now,
            })
            .eq("id", existing.id);

          if (error) {
            console.error("[admin/stripe/country-pricing] Failed to update country pricing:", error);
            return NextResponse.json(
              { error: "Failed to update country pricing" },
              { status: 500 }
            );
          }
        } else {
          // Insert
          const { error } = await admin.from("country_pricing").insert({
            country_code: countryCode,
            plan_key: planKey,
            currency,
            currency_symbol: currencySymbol,
            monthly_amount_cents: monthlyAmountCents,
            first_month_amount_cents: firstMonthAmountCents,
            is_active: isActive,
            created_at: now,
            updated_at: now,
          });

          if (error) {
            console.error("[admin/stripe/country-pricing] Failed to insert country pricing:", error);
            return NextResponse.json(
              { error: "Failed to insert country pricing" },
              { status: 500 }
            );
          }
        }

        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/stripe/country-pricing] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
