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

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "Not authenticated") {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }
  if (error instanceof Error && error.message === "Admin access required") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// GET — List Stripe products, coupons, price-mappings, or country-pricing
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // ----- products -----
    if (type === "products") {
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
        ...product,
        prices: pricesByProduct[product.id] || [],
      }));

      return NextResponse.json({ products: productsWithPrices });
    }

    // ----- coupons -----
    if (type === "coupons") {
      const coupons = await stripe.coupons.list({ limit: 100 });
      return NextResponse.json({ coupons: coupons.data });
    }

    // ----- price-mappings -----
    if (type === "price-mappings") {
      const { data: mappings, error } = await admin
        .from("stripe_prices")
        .select("*")
        .order("key");

      if (error) {
        console.error("[admin/stripe] Failed to fetch price mappings:", error);
        return NextResponse.json(
          { error: "Failed to fetch price mappings" },
          { status: 500 }
        );
      }

      return NextResponse.json({ priceMappings: mappings });
    }

    // ----- country-pricing -----
    if (type === "country-pricing") {
      const { data: pricing, error } = await admin
        .from("country_pricing")
        .select("*")
        .order("country_code");

      if (error) {
        console.error("[admin/stripe] Failed to fetch country pricing:", error);
        return NextResponse.json(
          { error: "Failed to fetch country pricing" },
          { status: 500 }
        );
      }

      return NextResponse.json({ countryPricing: pricing });
    }

    // ----- default: return all price-mappings -----
    const { data: mappings, error } = await admin
      .from("stripe_prices")
      .select("*")
      .order("key");

    if (error) {
      console.error("[admin/stripe] Failed to fetch price mappings:", error);
      return NextResponse.json(
        { error: "Failed to fetch price mappings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ priceMappings: mappings });
  } catch (error) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;
    console.error("[admin/stripe] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Stripe product/price/coupon management + price mapping sync
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

        return NextResponse.json({
          ok: true,
          product,
          price,
        });
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

      // =====================================================================
      // create_coupon — Create a Stripe coupon
      // =====================================================================
      case "create_coupon": {
        const {
          name,
          duration,
          amountOffCents,
          percentOff,
          currency,
          durationInMonths,
          maxRedemptions,
        } = body as {
          name: string;
          duration: Stripe.CouponCreateParams["duration"];
          amountOffCents?: number;
          percentOff?: number;
          currency?: string;
          durationInMonths?: number;
          maxRedemptions?: number;
        };

        if (!name || !duration) {
          return NextResponse.json(
            { error: "name and duration are required" },
            { status: 400 }
          );
        }

        if (!amountOffCents && !percentOff) {
          return NextResponse.json(
            { error: "Either amountOffCents or percentOff is required" },
            { status: 400 }
          );
        }

        const couponParams: Stripe.CouponCreateParams = {
          name,
          duration,
          ...(amountOffCents && { amount_off: amountOffCents }),
          ...(percentOff && { percent_off: percentOff }),
          ...(currency && { currency: currency.toLowerCase() }),
          ...(durationInMonths && { duration_in_months: durationInMonths }),
          ...(maxRedemptions && { max_redemptions: maxRedemptions }),
        };

        const coupon = await stripe.coupons.create(couponParams);
        return NextResponse.json({ ok: true, coupon });
      }

      // =====================================================================
      // delete_coupon — Delete a Stripe coupon
      // =====================================================================
      case "delete_coupon": {
        const { couponId } = body as { couponId: string };

        if (!couponId) {
          return NextResponse.json(
            { error: "couponId is required" },
            { status: 400 }
          );
        }

        await stripe.coupons.del(couponId);
        return NextResponse.json({ ok: true });
      }

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
          console.error("[admin/stripe] Failed to update price mapping:", error);
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
          console.error("[admin/stripe] Failed to delete price mapping:", error);
          return NextResponse.json(
            { error: "Failed to delete price mapping" },
            { status: 500 }
          );
        }

        return NextResponse.json({ ok: true });
      }

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
            console.error("[admin/stripe] Failed to update country pricing:", error);
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
            console.error("[admin/stripe] Failed to insert country pricing:", error);
            return NextResponse.json(
              { error: "Failed to insert country pricing" },
              { status: 500 }
            );
          }
        }

        return NextResponse.json({ ok: true });
      }

      // =====================================================================
      // setup_regional_prices — Create Stripe products + prices for a region
      // and save mappings to stripe_prices table
      // =====================================================================
      case "setup_regional_prices": {
        const { region } = body as { region?: string };
        const regionKey = region || "mena_local";

        // Regional pricing config (matches lib/country-pricing.ts)
        const REGIONAL_PLANS: Record<
          string,
          {
            plans: { planKey: string; label: string; amountCents: number }[];
          }
        > = {
          mena_local: {
            plans: [
              { planKey: "starter", label: "Basic (MENA)", amountCents: 1300 },
              { planKey: "growth", label: "Pro (MENA)", amountCents: 2200 },
              { planKey: "dominant", label: "Premium (MENA)", amountCents: 3700 },
            ],
          },
        };

        const regionConfig = REGIONAL_PLANS[regionKey];
        if (!regionConfig) {
          return NextResponse.json(
            { error: `Unknown region: ${regionKey}` },
            { status: 400 }
          );
        }

        const results: { planKey: string; productId: string; priceId: string; mappingKey: string }[] = [];
        const now = Date.now();

        for (const plan of regionConfig.plans) {
          const mappingKey = `${plan.planKey}:${regionKey}`;

          // Check if mapping already exists
          const { data: existing } = await admin
            .from("stripe_prices")
            .select("key, price_id")
            .eq("key", mappingKey)
            .maybeSingle();

          if (existing) {
            results.push({
              planKey: plan.planKey,
              productId: "",
              priceId: existing.price_id,
              mappingKey,
            });
            continue;
          }

          // Create Stripe product
          const product = await stripe.products.create({
            name: plan.label,
            metadata: { region: regionKey, planKey: plan.planKey },
          });

          // Create recurring monthly price
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.amountCents,
            currency: "usd",
            recurring: { interval: "month" },
            lookup_key: mappingKey,
          });

          // Set as default price
          await stripe.products.update(product.id, {
            default_price: price.id,
          });

          // Save mapping
          await admin.from("stripe_prices").upsert(
            {
              key: mappingKey,
              price_id: price.id,
              product_id: product.id,
              label: plan.label,
              updated_at: now,
            },
            { onConflict: "key" }
          );

          results.push({
            planKey: plan.planKey,
            productId: product.id,
            priceId: price.id,
            mappingKey,
          });
        }

        return NextResponse.json({ ok: true, region: regionKey, results });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const authResp = handleAuthError(error);
    if (authResp) return authResp;

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[admin/stripe] Stripe error:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    console.error("[admin/stripe] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
