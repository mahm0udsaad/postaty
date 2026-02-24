import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ---------------------------------------------------------------------------
// GET — List Stripe products with their prices
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    await requireAdmin();

    const [products, prices] = await Promise.all([
      stripe.products.list({ limit: 100, active: true }),
      stripe.prices.list({ limit: 100, active: true }),
    ]);

    const pricesByProduct: Record<string, Stripe.Price[]> = {};
    for (const price of prices.data) {
      const productId =
        typeof price.product === "string"
          ? price.product
          : price.product.id;
      if (!pricesByProduct[productId]) pricesByProduct[productId] = [];
      pricesByProduct[productId].push(price);
    }

    const productsWithPrices = products.data.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      active: product.active,
      metadata: product.metadata,
      defaultPriceId:
        typeof product.default_price === "string"
          ? product.default_price
          : product.default_price?.id ?? null,
      prices: (pricesByProduct[product.id] || []).map((p) => ({
        id: p.id,
        unitAmount: p.unit_amount,
        currency: p.currency,
        recurring: p.recurring
          ? { interval: p.recurring.interval }
          : null,
        lookupKey: p.lookup_key,
        active: p.active,
      })),
    }));

    return NextResponse.json({ products: productsWithPrices });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/stripe/products] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Create/update products, create/deactivate prices, archive products
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      // =====================================================================
      // create_product — Create Stripe product + price, save mapping
      // =====================================================================
      case "create_product": {
        const {
          name,
          description,
          priceAmountCents,
          currency,
          billingType,
          interval,
          lookupKey,
        } = body as {
          name: string;
          description?: string;
          priceAmountCents: number;
          currency: string;
          billingType: "recurring" | "one_time";
          interval?: "month" | "year";
          lookupKey: string;
        };

        if (!name || !priceAmountCents || !currency || !billingType || !lookupKey) {
          return NextResponse.json(
            { error: "name, priceAmountCents, currency, billingType, and lookupKey are required" },
            { status: 400 }
          );
        }

        // Create Stripe product
        const product = await stripe.products.create({
          name,
          ...(description && { description }),
        });

        // Create Stripe price
        const priceParams: Stripe.PriceCreateParams = {
          product: product.id,
          unit_amount: priceAmountCents,
          currency: currency.toLowerCase(),
          lookup_key: lookupKey,
          ...(billingType === "recurring" && {
            recurring: { interval: interval || "month" },
          }),
        };
        const price = await stripe.prices.create(priceParams);

        // Set as default price
        await stripe.products.update(product.id, {
          default_price: price.id,
        });

        // Save mapping in stripe_prices
        const now = Date.now();
        await admin.from("stripe_prices").upsert(
          {
            key: lookupKey,
            price_id: price.id,
            product_id: product.id,
            label: name,
            updated_at: now,
          },
          { onConflict: "key" }
        );

        return NextResponse.json({ ok: true, product, price });
      }

      // =====================================================================
      // update_product — Update Stripe product metadata/name/description
      // =====================================================================
      case "update_product": {
        const { productId, name, description, metadata } = body as {
          productId: string;
          name?: string;
          description?: string;
          metadata?: Record<string, string>;
        };

        if (!productId) {
          return NextResponse.json(
            { error: "productId is required" },
            { status: 400 }
          );
        }

        const updateParams: Stripe.ProductUpdateParams = {};
        if (name !== undefined) updateParams.name = name;
        if (description !== undefined) updateParams.description = description;
        if (metadata !== undefined) updateParams.metadata = metadata;

        const product = await stripe.products.update(productId, updateParams);
        return NextResponse.json({ ok: true, product });
      }

      // =====================================================================
      // create_price — Create new price on existing product
      // =====================================================================
      case "create_price": {
        const {
          productId,
          amountCents,
          currency,
          billingType,
          interval,
          lookupKey,
        } = body as {
          productId: string;
          amountCents: number;
          currency: string;
          billingType: "recurring" | "one_time";
          interval?: "month" | "year";
          lookupKey: string;
        };

        if (!productId || !amountCents || !currency || !billingType || !lookupKey) {
          return NextResponse.json(
            { error: "productId, amountCents, currency, billingType, and lookupKey are required" },
            { status: 400 }
          );
        }

        const priceParams: Stripe.PriceCreateParams = {
          product: productId,
          unit_amount: amountCents,
          currency: currency.toLowerCase(),
          lookup_key: lookupKey,
          ...(billingType === "recurring" && {
            recurring: { interval: interval || "month" },
          }),
        };
        const price = await stripe.prices.create(priceParams);

        // Update default_price on product
        await stripe.products.update(productId, {
          default_price: price.id,
        });

        // Sync price mapping
        const now = Date.now();
        const product = await stripe.products.retrieve(productId);
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

        return NextResponse.json({ ok: true, price });
      }

      // =====================================================================
      // deactivate_price — Deactivate a Stripe price
      // =====================================================================
      case "deactivate_price": {
        const { priceId, productId } = body as {
          priceId: string;
          productId: string;
        };

        if (!priceId || !productId) {
          return NextResponse.json(
            { error: "priceId and productId are required" },
            { status: 400 }
          );
        }

        // Deactivate the price in Stripe
        await stripe.prices.update(priceId, { active: false });

        // Remove price mapping for the lookup_key
        const deactivatedPrice = await stripe.prices.retrieve(priceId);
        if (deactivatedPrice.lookup_key) {
          await admin
            .from("stripe_prices")
            .delete()
            .eq("key", deactivatedPrice.lookup_key);
        }

        return NextResponse.json({ ok: true });
      }

      // =====================================================================
      // archive_product — Archive a Stripe product and all its prices
      // =====================================================================
      case "archive_product": {
        const { productId } = body as { productId: string };

        if (!productId) {
          return NextResponse.json(
            { error: "productId is required" },
            { status: 400 }
          );
        }

        // Deactivate all active prices for this product
        const prices = await stripe.prices.list({
          product: productId,
          active: true,
          limit: 100,
        });

        for (const price of prices.data) {
          await stripe.prices.update(price.id, { active: false });
        }

        // Archive the product
        await stripe.products.update(productId, { active: false });

        // Remove all price mappings for this product
        await admin
          .from("stripe_prices")
          .delete()
          .eq("product_id", productId);

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
      console.error("[admin/stripe/products] Stripe error:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    console.error("[admin/stripe/products] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
