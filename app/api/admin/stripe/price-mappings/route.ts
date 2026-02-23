import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Name patterns for inferring lookup keys during price sync
const PRODUCT_NAME_PATTERNS = [
  { pattern: /starter/i, key: "starter" },
  { pattern: /growth/i, key: "growth" },
  { pattern: /dominant/i, key: "dominant" },
  { pattern: /addon[_\s-]*5|5[_\s-]*credit/i, key: "addon_5" },
  { pattern: /addon[_\s-]*10|10[_\s-]*credit/i, key: "addon_10" },
];

function inferKeyFromProductName(name: string): string | null {
  for (const { pattern, key } of PRODUCT_NAME_PATTERNS) {
    if (pattern.test(name)) return key;
  }
  return null;
}

// ---------------------------------------------------------------------------
// GET — List price mappings from stripe_prices table
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: mappings, error } = await admin
      .from("stripe_prices")
      .select("*")
      .order("key");

    if (error) {
      console.error("[admin/stripe/price-mappings] Failed to fetch price mappings:", error);
      return NextResponse.json(
        { error: "Failed to fetch price mappings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ priceMappings: mappings });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/stripe/price-mappings] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Sync prices, update/delete price mappings
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      // =====================================================================
      // sync_prices — Sync all active Stripe prices to stripe_prices table
      // =====================================================================
      case "sync_prices": {
        const allPrices = await stripe.prices.list({
          limit: 100,
          active: true,
          expand: ["data.product"],
        });

        const now = Date.now();
        let synced = 0;
        let skipped = 0;

        for (const price of allPrices.data) {
          // Determine lookup key
          let lookupKey = price.lookup_key;

          // If no lookup_key, try to infer from product name
          if (!lookupKey) {
            const product = price.product as Stripe.Product;
            if (product && product.name) {
              const inferredKey = inferKeyFromProductName(product.name);
              if (inferredKey) {
                // Append interval suffix for recurring prices
                if (price.recurring?.interval === "year") {
                  lookupKey = `${inferredKey}_yearly`;
                } else if (price.recurring?.interval === "month") {
                  lookupKey = `${inferredKey}_monthly`;
                } else {
                  lookupKey = inferredKey;
                }
              }
            }
          }

          if (!lookupKey) {
            skipped++;
            continue;
          }

          const productId =
            typeof price.product === "string"
              ? price.product
              : (price.product as Stripe.Product).id;

          const product =
            typeof price.product === "string"
              ? await stripe.products.retrieve(price.product)
              : (price.product as Stripe.Product);

          await admin.from("stripe_prices").upsert(
            {
              key: lookupKey,
              price_id: price.id,
              product_id: productId,
              label: product.name,
              updated_at: now,
            },
            { onConflict: "key" }
          );
          synced++;
        }

        return NextResponse.json({ ok: true, synced, skipped });
      }

      // =====================================================================
      // update_price_mapping — Update a mapping in stripe_prices
      // =====================================================================
      case "update_price_mapping": {
        const { key, priceId, productId, label } = body as {
          key: string;
          priceId: string;
          productId: string;
          label?: string;
        };

        if (!key || !priceId || !productId) {
          return NextResponse.json(
            { error: "key, priceId, and productId are required" },
            { status: 400 }
          );
        }

        const now = Date.now();
        const { error } = await admin.from("stripe_prices").upsert(
          {
            key,
            price_id: priceId,
            product_id: productId,
            ...(label && { label }),
            updated_at: now,
          },
          { onConflict: "key" }
        );

        if (error) {
          console.error("[admin/stripe/price-mappings] Failed to update price mapping:", error);
          return NextResponse.json(
            { error: "Failed to update price mapping" },
            { status: 500 }
          );
        }

        return NextResponse.json({ ok: true });
      }

      // =====================================================================
      // delete_price_mapping — Delete from stripe_prices
      // =====================================================================
      case "delete_price_mapping": {
        const { key } = body as { key: string };

        if (!key) {
          return NextResponse.json(
            { error: "key is required" },
            { status: 400 }
          );
        }

        const { error } = await admin
          .from("stripe_prices")
          .delete()
          .eq("key", key);

        if (error) {
          console.error("[admin/stripe/price-mappings] Failed to delete price mapping:", error);
          return NextResponse.json(
            { error: "Failed to delete price mapping" },
            { status: 500 }
          );
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

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[admin/stripe/price-mappings] Stripe error:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    console.error("[admin/stripe/price-mappings] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
