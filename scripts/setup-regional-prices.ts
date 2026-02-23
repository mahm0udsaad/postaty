/**
 * One-time script to create MENA regional Stripe products/prices
 * and save mappings to the stripe_prices Supabase table.
 *
 * Run: bun scripts/setup-regional-prices.ts
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REGION_KEY = "mena_local";

const PLANS = [
  { planKey: "starter", label: "Basic (MENA)", amountCents: 1300 },
  { planKey: "growth", label: "Pro (MENA)", amountCents: 2200 },
  { planKey: "dominant", label: "Premium (MENA)", amountCents: 3700 },
];

async function main() {
  console.log("Setting up MENA regional Stripe prices...\n");

  for (const plan of PLANS) {
    const mappingKey = `${plan.planKey}:${REGION_KEY}`;

    // Check if mapping already exists
    const { data: existing } = await supabase
      .from("stripe_prices")
      .select("key, price_id")
      .eq("key", mappingKey)
      .maybeSingle();

    if (existing) {
      console.log(`  [skip] ${mappingKey} already exists (price: ${existing.price_id})`);
      continue;
    }

    // Create Stripe product
    const product = await stripe.products.create({
      name: plan.label,
      metadata: { region: REGION_KEY, planKey: plan.planKey },
    });
    console.log(`  [created] Product: ${product.id} — ${plan.label}`);

    // Create recurring monthly price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amountCents,
      currency: "usd",
      recurring: { interval: "month" },
      lookup_key: mappingKey,
    });
    console.log(`  [created] Price: ${price.id} — $${plan.amountCents / 100}/mo`);

    // Set as default price
    await stripe.products.update(product.id, { default_price: price.id });

    // Save mapping to stripe_prices table
    const { error } = await supabase.from("stripe_prices").upsert(
      {
        key: mappingKey,
        price_id: price.id,
        product_id: product.id,
        label: plan.label,
        updated_at: Date.now(),
      },
      { onConflict: "key" }
    );

    if (error) {
      console.error(`  [error] Failed to save mapping for ${mappingKey}:`, error.message);
    } else {
      console.log(`  [saved] Mapping: ${mappingKey} → ${price.id}\n`);
    }
  }

  console.log("Done! Verify with: SELECT * FROM stripe_prices WHERE key LIKE '%mena%';");
}

main().catch(console.error);
