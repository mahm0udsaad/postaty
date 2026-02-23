#!/usr/bin/env npx tsx
/**
 * Convex → Supabase Data Migration Script
 *
 * Prerequisites:
 * 1. Run `npx convex export --path ./convex-export` first to export all Convex data
 * 2. Set environment variables in .env.local:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 *    - NEXT_PUBLIC_CONVEX_URL (for downloading storage files)
 *
 * Usage:
 *   npx tsx scripts/migrate-convex-to-supabase.ts [--dry-run] [--skip-files] [--skip-auth]
 *
 * Flags:
 *   --dry-run     Print what would be done without making changes
 *   --skip-files  Skip file storage migration (data only)
 *   --skip-auth   Skip Supabase Auth user creation
 *   --table=NAME  Only migrate a specific table
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>;

// ─── Config ────────────────────────────────────────────────────────────────────

const EXPORT_DIR = path.resolve(process.cwd(), "convex-export-data");

const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_FILES = process.argv.includes("--skip-files");
const SKIP_AUTH = process.argv.includes("--skip-auth");
const TABLE_FILTER = process.argv
  .find((a) => a.startsWith("--table="))
  ?.split("=")[1];

// ─── Load env from .env.local ──────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("ERROR: .env.local not found. Please create it with required env vars.");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnv();

// Read env vars AFTER loading .env.local
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ─── Supabase Admin Client ────────────────────────────────────────────────────

function getSupabase(): AnySupabase {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
    process.exit(1);
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as AnySupabase;
}

// ─── ID Mapping ────────────────────────────────────────────────────────────────

// Maps Convex _id → new UUID for each table
const idMaps: Record<string, Map<string, string>> = {};

// Maps Clerk ID → Supabase Auth UUID
const clerkToAuthMap = new Map<string, string>();

// Maps Convex storageId → Supabase storage path
const storageIdToPath = new Map<string, string>();

function getNewId(table: string, convexId: string): string {
  if (!idMaps[table]) idMaps[table] = new Map();
  let newId = idMaps[table].get(convexId);
  if (!newId) {
    newId = randomUUID();
    idMaps[table].set(convexId, newId);
  }
  return newId;
}

function lookupId(table: string, convexId: string | undefined | null): string | null {
  if (!convexId) return null;
  return idMaps[table]?.get(convexId) ?? null;
}

// ─── Read Convex Export ────────────────────────────────────────────────────────

function readConvexTable(tableName: string): any[] {
  // Convex export format: tableName/documents.jsonl
  const nestedPath = path.join(EXPORT_DIR, tableName, "documents.jsonl");
  if (fs.existsSync(nestedPath)) {
    return fs
      .readFileSync(nestedPath, "utf-8")
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l));
  }

  // Fallback: flat file
  const flatPath = path.join(EXPORT_DIR, `${tableName}.jsonl`);
  if (fs.existsSync(flatPath)) {
    return fs
      .readFileSync(flatPath, "utf-8")
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l));
  }

  console.warn(`  ⚠ Table "${tableName}" not found in export.`);
  return [];
}

// ─── File Storage Migration ────────────────────────────────────────────────────

async function downloadConvexFile(storageId: string): Promise<Buffer | null> {
  try {
    const url = `${CONVEX_URL}/api/storage/${storageId}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  ⚠ Failed to download file ${storageId}: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.warn(`  ⚠ Error downloading file ${storageId}:`, err);
    return null;
  }
}

async function uploadToSupabase(
  supabase: AnySupabase,
  buffer: Buffer,
  bucket: string,
  storagePath: string
): Promise<string | null> {
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would upload to ${bucket}/${storagePath}`);
    return storagePath;
  }
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) {
    console.error(`  ✗ Upload error ${bucket}/${storagePath}: ${error.message}`);
    return null;
  }
  return storagePath;
}

function determineBucket(context: string): string {
  switch (context) {
    case "generation":
      return "generations";
    case "logo":
      return "logos";
    case "showcase":
      return "showcase";
    case "feedback":
      return "feedback";
    case "preview":
      return "previews";
    default:
      return "generations";
  }
}

// ─── Auth User Migration ───────────────────────────────────────────────────────

async function migrateAuthUsers(
  supabase: AnySupabase,
  users: any[]
) {
  console.log("\n═══ Phase 1: Creating Supabase Auth Users ═══");
  console.log(`  Found ${users.length} Clerk users to migrate.`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of users) {
    const clerkId = user.clerkId;
    const email = user.email;

    if (!email) {
      console.warn(`  ⚠ User ${clerkId} has no email, skipping auth creation.`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      const fakeUuid = randomUUID();
      clerkToAuthMap.set(clerkId, fakeUuid);
      console.log(`  [DRY-RUN] Would create auth user: ${email} (clerk: ${clerkId})`);
      created++;
      continue;
    }

    // Check if user already exists in Supabase Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    // Try to find by email
    const { data: usersByEmail } = await supabase
      .from("users")
      .select("auth_id")
      .eq("email", email)
      .limit(1) as { data: any[] | null };

    if (usersByEmail && usersByEmail.length > 0) {
      clerkToAuthMap.set(clerkId, usersByEmail[0].auth_id);
      skipped++;
      continue;
    }

    // Create new Supabase Auth user
    const { data: authUser, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        name: user.name || "",
        clerk_id: clerkId,
        migrated: true,
      },
    });

    if (error) {
      if (error.message?.includes("already been registered")) {
        // User exists, look them up
        const { data: lookupData } = await supabase.auth.admin.listUsers() as { data: any };
        const existingUser = lookupData?.users?.find((u: any) => u.email === email);
        if (existingUser) {
          clerkToAuthMap.set(clerkId, existingUser.id);
          skipped++;
          continue;
        }
      }
      console.error(`  ✗ Failed to create auth for ${email}: ${error.message}`);
      errors++;
      continue;
    }

    clerkToAuthMap.set(clerkId, authUser.user.id);
    created++;
  }

  console.log(
    `  Auth users: ${created} created, ${skipped} skipped, ${errors} errors`
  );
}

// ─── Storage File Migration ────────────────────────────────────────────────────

async function migrateStorageFiles(
  supabase: AnySupabase,
  allDocs: Record<string, any[]>
) {
  console.log("\n═══ Phase 2: Migrating Storage Files ═══");

  // Collect all storageId references from all tables
  const storageRefs: Array<{
    storageId: string;
    context: string;
    sourceTable: string;
  }> = [];

  // Generations: outputs[].storageId
  for (const gen of allDocs.generations || []) {
    if (gen.outputs && Array.isArray(gen.outputs)) {
      for (const output of gen.outputs) {
        if (output.storageId) {
          storageRefs.push({
            storageId: output.storageId,
            context: "generation",
            sourceTable: "generations",
          });
        }
      }
    }
  }

  // Brand kits: logoStorageId
  for (const bk of allDocs.brand_kits || []) {
    if (bk.logoStorageId) {
      storageRefs.push({
        storageId: bk.logoStorageId,
        context: "logo",
        sourceTable: "brand_kits",
      });
    }
  }

  // Users: logoStorageId
  for (const u of allDocs.users || []) {
    if (u.logoStorageId) {
      storageRefs.push({
        storageId: u.logoStorageId,
        context: "logo",
        sourceTable: "users",
      });
    }
  }

  // Templates: previewStorageId
  for (const t of allDocs.templates || []) {
    if (t.previewStorageId) {
      storageRefs.push({
        storageId: t.previewStorageId,
        context: "preview",
        sourceTable: "templates",
      });
    }
  }

  // Poster templates: previewStorageId
  for (const pt of allDocs.poster_templates || []) {
    if (pt.previewStorageId) {
      storageRefs.push({
        storageId: pt.previewStorageId,
        context: "preview",
        sourceTable: "poster_templates",
      });
    }
  }

  // Poster jobs: results[].storageId
  for (const pj of allDocs.poster_jobs || []) {
    if (pj.results && Array.isArray(pj.results)) {
      for (const result of pj.results) {
        if (result.storageId) {
          storageRefs.push({
            storageId: result.storageId,
            context: "generation",
            sourceTable: "poster_jobs",
          });
        }
      }
    }
  }

  // Showcase images: storageId
  for (const si of allDocs.showcase_images || []) {
    if (si.storageId) {
      storageRefs.push({
        storageId: si.storageId,
        context: "showcase",
        sourceTable: "showcase_images",
      });
    }
  }

  // Feedback: imageStorageId
  for (const fb of allDocs.feedback || []) {
    if (fb.imageStorageId) {
      storageRefs.push({
        storageId: fb.imageStorageId,
        context: "feedback",
        sourceTable: "feedback",
      });
    }
  }

  // Deduplicate
  const uniqueRefs = new Map<string, (typeof storageRefs)[0]>();
  for (const ref of storageRefs) {
    if (!uniqueRefs.has(ref.storageId)) {
      uniqueRefs.set(ref.storageId, ref);
    }
  }

  console.log(`  Found ${uniqueRefs.size} unique storage files to migrate.`);

  let migrated = 0;
  let failed = 0;
  const total = uniqueRefs.size;

  for (const [storageId, ref] of uniqueRefs) {
    const bucket = determineBucket(ref.context);
    const storagePath = `migrated/${storageId}.png`;

    // Download from Convex
    const buffer = await downloadConvexFile(storageId);
    if (!buffer) {
      failed++;
      // Store a placeholder path so data migration can still proceed
      storageIdToPath.set(storageId, storagePath);
      continue;
    }

    // Upload to Supabase
    const result = await uploadToSupabase(supabase, buffer, bucket, storagePath);
    if (result) {
      storageIdToPath.set(storageId, result);
      migrated++;
    } else {
      storageIdToPath.set(storageId, storagePath);
      failed++;
    }

    if ((migrated + failed) % 10 === 0) {
      console.log(`  Progress: ${migrated + failed}/${total} files processed`);
    }
  }

  console.log(
    `  Storage: ${migrated} migrated, ${failed} failed, ${total} total`
  );
}

// ─── Table Migration Functions ─────────────────────────────────────────────────

async function insertBatch(
  supabase: AnySupabase,
  table: string,
  rows: any[],
  batchSize = 100
) {
  if (rows.length === 0) return { inserted: 0, errors: 0 };
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would insert ${rows.length} rows into "${table}"`);
    return { inserted: rows.length, errors: 0 };
  }

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch as any);
    if (error) {
      console.error(`  ✗ Insert error in "${table}" (batch ${Math.floor(i / batchSize) + 1}): ${error.message}`);
      // Try one by one
      for (const row of batch) {
        const { error: singleError } = await supabase.from(table).insert(row as any);
        if (singleError) {
          console.error(`    ✗ Row error: ${singleError.message} — Row ID: ${row.id}`);
          errors++;
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}

/** Truncate Convex floating-point timestamps to integers for Postgres bigint columns */
function ts(val: number | undefined | null): number | null {
  if (val == null) return null;
  return Math.floor(val);
}

function resolveAuthId(clerkId: string | undefined | null): string {
  if (!clerkId) return "";
  return clerkToAuthMap.get(clerkId) || clerkId; // Fallback to clerk ID if not mapped
}

function resolveStoragePath(storageId: string | undefined | null): string | null {
  if (!storageId) return null;
  return storageIdToPath.get(storageId) || `migrated/${storageId}.png`;
}

// ─── Transform Functions (Convex → Supabase) ──────────────────────────────────

function transformOrganization(doc: any): any {
  return {
    id: getNewId("organizations", doc._id),
    name: doc.name || "",
    slug: doc.slug || "",
    plan: doc.plan || "free",
    credits_balance: doc.creditsBalance ?? 0,
    credits_monthly_allowance: doc.creditsMonthlyAllowance ?? 0,
    current_period_start: ts(doc.currentPeriodStart) ?? ts(doc._creationTime),
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformUser(doc: any): any {
  return {
    id: getNewId("users", doc._id),
    auth_id: resolveAuthId(doc.clerkId),
    email: doc.email || "",
    name: doc.name || "",
    org_id: lookupId("organizations", doc.orgId),
    role: doc.role || "member",
    onboarded: doc.onboarded ?? false,
    business_name: doc.businessName || null,
    business_category: doc.businessCategory || null,
    brand_colors: doc.brandColors || null,
    logo_storage_path: resolveStoragePath(doc.logoStorageId),
    detected_country: doc.detectedCountry || null,
    pricing_country: doc.pricingCountry || null,
    country_source: doc.countrySource || null,
    country_locked_at: ts(doc.countryLockedAt),
    last_seen_at: ts(doc.lastSeenAt),
    status: doc.status || "active",
    status_reason: doc.statusReason || null,
    status_updated_at: ts(doc.statusUpdatedAt),
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformBrandKit(doc: any): any {
  return {
    id: getNewId("brand_kits", doc._id),
    org_id: lookupId("organizations", doc.orgId)!,
    name: doc.name || "",
    logo_storage_path: resolveStoragePath(doc.logoStorageId),
    palette: doc.palette || {},
    extracted_colors: doc.extractedColors || [],
    font_family: doc.fontFamily || "",
    style_adjectives: doc.styleAdjectives || [],
    do_rules: doc.doRules || [],
    dont_rules: doc.dontRules || [],
    style_seed: doc.styleSeed || null,
    is_default: doc.isDefault ?? false,
    updated_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformTemplate(doc: any): any {
  return {
    id: getNewId("templates", doc._id),
    slug: doc.slug || `template-${randomUUID().slice(0, 8)}`,
    name: doc.name || "",
    name_ar: doc.nameAr || doc.name || "",
    category: doc.category || "general",
    supported_formats: doc.supportedFormats || [],
    layers: doc.layers || [],
    preview_storage_path: resolveStoragePath(doc.previewStorageId),
    is_system: doc.isSystem ?? false,
    org_id: lookupId("organizations", doc.orgId),
    parent_template_id: lookupId("templates", doc.parentTemplateId),
    parent_version: doc.parentVersion || null,
    version: doc.version ?? 1,
    locales: doc.locales || [],
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformPosterTemplate(doc: any): any {
  return {
    id: getNewId("poster_templates", doc._id),
    org_id: lookupId("organizations", doc.orgId)!,
    user_id: lookupId("users", doc.userId)!,
    name: doc.name || "",
    name_ar: doc.nameAr || doc.name || "",
    description: doc.description || "",
    category: doc.category || "restaurant",
    style: doc.style || "",
    design_json: doc.designJson || "{}",
    preview_storage_path: resolveStoragePath(doc.previewStorageId),
    is_public: doc.isPublic ?? false,
    usage_count: doc.usageCount ?? 0,
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformGeneration(doc: any): any {
  // Transform outputs — replace storageId with storage_path and add URL
  const outputs = (doc.outputs || []).map((out: any) => ({
    ...out,
    storage_path: resolveStoragePath(out.storageId),
    url: out.storageId
      ? getStoragePublicUrl(determineBucket("generation"), resolveStoragePath(out.storageId)!)
      : out.url || null,
  }));

  return {
    id: getNewId("generations", doc._id),
    org_id: lookupId("organizations", doc.orgId)!,
    user_id: lookupId("users", doc.userId)!,
    brand_kit_id: lookupId("brand_kits", doc.brandKitId),
    template_id: lookupId("templates", doc.templateId),
    category: doc.category || "restaurant",
    business_name: doc.businessName || "",
    product_name: doc.productName || "",
    inputs: typeof doc.inputs === "string" ? doc.inputs : JSON.stringify(doc.inputs || {}),
    prompt_used: doc.promptUsed || "",
    outputs,
    status: doc.status || "complete",
    credits_charged: Math.floor(doc.creditsCharged ?? 0),
    duration_ms: doc.durationMs ? Math.floor(doc.durationMs) : null,
    error: doc.error || null,
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformPosterJob(doc: any): any {
  // Transform results — replace storageId with storage_path
  const results = (doc.results || []).map((r: any) => ({
    ...r,
    storage_path: resolveStoragePath(r.storageId),
    url: r.storageId
      ? getStoragePublicUrl("generations", resolveStoragePath(r.storageId)!)
      : r.url || null,
  }));

  return {
    id: getNewId("poster_jobs", doc._id),
    org_id: lookupId("organizations", doc.orgId)!,
    user_id: lookupId("users", doc.userId)!,
    generation_id: lookupId("generations", doc.generationId),
    category: doc.category || "restaurant",
    form_data_json: doc.formDataJson || "{}",
    status: doc.status || "complete",
    designs_json: doc.designsJson || null,
    results,
    total_designs: doc.totalDesigns ?? 0,
    completed_designs: doc.completedDesigns ?? 0,
    error: doc.error || null,
    started_at: ts(doc.startedAt) || ts(doc._creationTime) || Date.now(),
    completed_at: ts(doc.completedAt),
  };
}

function transformBilling(doc: any): any {
  return {
    id: getNewId("billing", doc._id),
    user_auth_id: resolveAuthId(doc.clerkUserId),
    stripe_customer_id: doc.stripeCustomerId || null,
    stripe_subscription_id: doc.stripeSubscriptionId || null,
    plan_key: doc.planKey || "none",
    status: doc.status || "none",
    current_period_start: ts(doc.currentPeriodStart),
    current_period_end: ts(doc.currentPeriodEnd),
    monthly_credit_limit: doc.monthlyCreditLimit ?? 0,
    monthly_credits_used: doc.monthlyCreditsUsed ?? 0,
    addon_credits_balance: doc.addonCreditsBalance ?? 0,
    updated_at: ts(doc._creationTime) || Date.now(),
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformStripeEvent(doc: any): any {
  return {
    id: getNewId("stripe_events", doc._id),
    event_id: doc.eventId,
    type: doc.type || "",
    status: doc.status || "processed",
    error: doc.error || null,
    processed_at: ts(doc.processedAt),
    created_at: ts(doc._creationTime) || Date.now(),
    updated_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformStripeRevenueEvent(doc: any): any {
  return {
    id: getNewId("stripe_revenue_events", doc._id),
    stripe_event_id: doc.stripeEventId || "",
    stripe_object_id: doc.stripeObjectId || null,
    user_auth_id: resolveAuthId(doc.clerkUserId),
    stripe_customer_id: doc.stripeCustomerId || null,
    source: doc.source || "subscription_invoice",
    amount_cents: doc.amountCents ?? 0,
    currency: doc.currency || "usd",
    estimated_stripe_fee_cents: doc.estimatedStripeFeeCents ?? 0,
    actual_stripe_fee_cents: doc.actualStripeFeeCents || null,
    net_amount_cents: doc.netAmountCents ?? 0,
    occurred_at: ts(doc.occurredAt) || ts(doc._creationTime) || Date.now(),
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformStripePrice(doc: any): any {
  return {
    id: getNewId("stripe_prices", doc._id),
    key: doc.key,
    price_id: doc.priceId,
    product_id: doc.productId,
    label: doc.label || null,
    updated_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformCreditLedger(doc: any): any {
  return {
    id: getNewId("credit_ledger", doc._id),
    user_auth_id: resolveAuthId(doc.clerkUserId),
    billing_id: lookupId("billing", doc.billingId),
    amount: doc.amount ?? 0,
    reason: doc.reason || "usage",
    source: doc.source || "system",
    stripe_event_id: doc.stripeEventId || null,
    stripe_checkout_session_id: doc.stripeCheckoutSessionId || null,
    idempotency_key: doc.idempotencyKey || null,
    monthly_credits_used_after: doc.monthlyCreditsUsedAfter ?? 0,
    addon_credits_balance_after: doc.addonCreditsBalanceAfter ?? 0,
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformCreditsLedger(doc: any): any {
  return {
    id: getNewId("credits_ledger", doc._id),
    org_id: lookupId("organizations", doc.orgId)!,
    user_id: lookupId("users", doc.userId)!,
    amount: doc.amount ?? 0,
    reason: doc.reason || "generation",
    generation_id: lookupId("generations", doc.generationId),
    balance_after: doc.balanceAfter ?? 0,
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformAiUsageEvent(doc: any): any {
  return {
    id: getNewId("ai_usage_events", doc._id),
    user_auth_id: resolveAuthId(doc.clerkUserId),
    model: doc.model || "",
    route: doc.route || "poster",
    input_tokens: doc.inputTokens ?? 0,
    output_tokens: doc.outputTokens ?? 0,
    images_generated: doc.imagesGenerated ?? 0,
    duration_ms: doc.durationMs ?? 0,
    success: doc.success ?? true,
    error: doc.error || null,
    estimated_cost_usd: doc.estimatedCostUsd ?? 0,
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformAiPricingConfig(doc: any): any {
  return {
    id: getNewId("ai_pricing_config", doc._id),
    model: doc.model || "",
    effective_from: ts(doc.effectiveFrom) || Date.now(),
    effective_to: ts(doc.effectiveTo),
    input_token_cost_per_1k: doc.inputTokenCostPer1k ?? 0,
    output_token_cost_per_1k: doc.outputTokenCostPer1k ?? 0,
    image_generation_cost: doc.imageGenerationCost ?? 0,
    notes: doc.notes || null,
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformSupportTicket(doc: any): any {
  return {
    id: getNewId("support_tickets", doc._id),
    user_auth_id: resolveAuthId(doc.clerkUserId),
    subject: doc.subject || "",
    status: doc.status || "open",
    priority: doc.priority || "medium",
    assigned_to: doc.assignedTo || null,
    created_at: doc.createdAt || ts(doc._creationTime) || Date.now(),
    updated_at: ts(doc.updatedAt) || ts(doc._creationTime) || Date.now(),
  };
}

function transformSupportMessage(doc: any): any {
  return {
    id: getNewId("support_messages", doc._id),
    ticket_id: lookupId("support_tickets", doc.ticketId)!,
    sender_auth_id: resolveAuthId(doc.senderClerkUserId),
    is_admin: doc.isAdmin ?? false,
    body: doc.body || "",
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformNotification(doc: any): any {
  return {
    id: getNewId("notifications", doc._id),
    user_auth_id: resolveAuthId(doc.clerkUserId),
    title: doc.title || "",
    body: doc.body || "",
    type: doc.type || "info",
    is_read: doc.isRead ?? false,
    metadata: doc.metadata ? (typeof doc.metadata === "string" ? doc.metadata : JSON.stringify(doc.metadata)) : null,
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformFeedback(doc: any): any {
  return {
    id: getNewId("feedback", doc._id),
    user_auth_id: resolveAuthId(doc.clerkUserId),
    generation_id: lookupId("generations", doc.generationId),
    rating: doc.rating || "like",
    comment: doc.comment || null,
    model: doc.model || null,
    category: doc.category || null,
    image_storage_path: resolveStoragePath(doc.imageStorageId),
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformShowcaseImage(doc: any): any {
  return {
    id: getNewId("showcase_images", doc._id),
    storage_path: resolveStoragePath(doc.storageId) || "",
    title: doc.title || null,
    category: doc.category || "",
    display_order: doc.order ?? 0,
    added_by: resolveAuthId(doc.addedBy),
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformCountryPricing(doc: any): any {
  return {
    id: getNewId("country_pricing", doc._id),
    country_code: doc.countryCode || "",
    plan_key: doc.planKey || "starter",
    currency: doc.currency || "USD",
    currency_symbol: doc.currencySymbol || "$",
    monthly_amount_cents: doc.monthlyAmountCents ?? 0,
    first_month_amount_cents: doc.firstMonthAmountCents ?? 0,
    is_active: doc.isActive ?? true,
    updated_at: ts(doc._creationTime) || Date.now(),
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

function transformAuditLog(doc: any): any {
  return {
    id: getNewId("audit_logs", doc._id),
    org_id: lookupId("organizations", doc.orgId)!,
    user_id: lookupId("users", doc.userId)!,
    action: doc.action || "",
    resource_type: doc.resourceType || "",
    resource_id: doc.resourceId || "",
    metadata: doc.metadata ? (typeof doc.metadata === "string" ? doc.metadata : JSON.stringify(doc.metadata)) : null,
    created_at: ts(doc._creationTime) || Date.now(),
  };
}

// ─── Helper ────────────────────────────────────────────────────────────────────

function getStoragePublicUrl(bucket: string, storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
}

// ─── Main Migration ────────────────────────────────────────────────────────────

async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║   Convex → Supabase Data Migration                   ║");
  console.log("╚═══════════════════════════════════════════════════════╝");

  if (DRY_RUN) {
    console.log("  *** DRY RUN MODE — No changes will be made ***\n");
  }

  // Check export directory
  if (!fs.existsSync(EXPORT_DIR)) {
    console.error(
      `ERROR: Export directory not found at ${EXPORT_DIR}\n` +
        `Please run: npx convex export --path ./convex-export`
    );
    process.exit(1);
  }

  // List available tables (each is a subdirectory with documents.jsonl)
  const exportDirs = fs
    .readdirSync(EXPORT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name);
  console.log(`\nFound export tables: ${exportDirs.join(", ")}\n`);

  const supabase = getSupabase();

  // ─── Read all Convex data ────────────────────────────────────────────────
  const allDocs: Record<string, any[]> = {
    organizations: readConvexTable("organizations"),
    users: readConvexTable("users"),
    brand_kits: readConvexTable("brand_kits"),
    templates: readConvexTable("templates"),
    poster_templates: readConvexTable("poster_templates"),
    generations: readConvexTable("generations"),
    poster_jobs: readConvexTable("poster_jobs"),
    billing: readConvexTable("billing"),
    stripe_events: readConvexTable("stripeEvents"),
    stripe_revenue_events: readConvexTable("stripeRevenueEvents"),
    stripe_prices: readConvexTable("stripePrices"),
    credit_ledger: readConvexTable("creditLedger"),
    credits_ledger: readConvexTable("credits_ledger"),
    ai_usage_events: readConvexTable("aiUsageEvents"),
    ai_pricing_config: readConvexTable("aiPricingConfig"),
    support_tickets: readConvexTable("supportTickets"),
    support_messages: readConvexTable("supportMessages"),
    notifications: readConvexTable("notifications"),
    feedback: readConvexTable("feedback"),
    showcase_images: readConvexTable("showcase_images"),
    country_pricing: readConvexTable("countryPricing"),
    audit_logs: readConvexTable("audit_logs"),
  };

  // Print counts
  console.log("Document counts:");
  for (const [table, docs] of Object.entries(allDocs)) {
    if (docs.length > 0) {
      console.log(`  ${table}: ${docs.length}`);
    }
  }

  // ─── Phase 1: Auth Users ─────────────────────────────────────────────────
  if (!SKIP_AUTH && allDocs.users.length > 0) {
    await migrateAuthUsers(supabase, allDocs.users);
  } else if (SKIP_AUTH) {
    console.log("\n═══ Phase 1: Auth Users (SKIPPED) ═══");
    // Still need to build clerkToAuthMap for FK references
    for (const user of allDocs.users) {
      if (user.clerkId) {
        clerkToAuthMap.set(user.clerkId, user.clerkId); // Use clerk ID as placeholder
      }
    }
  }

  // ─── Phase 2: Storage Files ──────────────────────────────────────────────
  if (!SKIP_FILES) {
    await migrateStorageFiles(supabase, allDocs);
  } else {
    console.log("\n═══ Phase 2: Storage Files (SKIPPED) ═══");
  }

  // ─── Phase 3: Table Data ─────────────────────────────────────────────────
  console.log("\n═══ Phase 3: Migrating Table Data ═══");

  // Pre-generate all IDs first (for FK references)
  for (const doc of allDocs.organizations) getNewId("organizations", doc._id);
  for (const doc of allDocs.users) getNewId("users", doc._id);
  for (const doc of allDocs.brand_kits) getNewId("brand_kits", doc._id);
  for (const doc of allDocs.templates) getNewId("templates", doc._id);
  for (const doc of allDocs.generations) getNewId("generations", doc._id);
  for (const doc of allDocs.billing) getNewId("billing", doc._id);
  for (const doc of allDocs.support_tickets) getNewId("support_tickets", doc._id);

  // Migration order (respects FK constraints)
  const migrationSteps: Array<{
    table: string;
    convexTable: string;
    transform: (doc: any) => any;
  }> = [
    { table: "organizations", convexTable: "organizations", transform: transformOrganization },
    { table: "users", convexTable: "users", transform: transformUser },
    { table: "brand_kits", convexTable: "brand_kits", transform: transformBrandKit },
    { table: "templates", convexTable: "templates", transform: transformTemplate },
    { table: "poster_templates", convexTable: "poster_templates", transform: transformPosterTemplate },
    { table: "generations", convexTable: "generations", transform: transformGeneration },
    { table: "poster_jobs", convexTable: "poster_jobs", transform: transformPosterJob },
    { table: "billing", convexTable: "billing", transform: transformBilling },
    { table: "stripe_events", convexTable: "stripe_events", transform: transformStripeEvent },
    { table: "stripe_revenue_events", convexTable: "stripe_revenue_events", transform: transformStripeRevenueEvent },
    { table: "stripe_prices", convexTable: "stripe_prices", transform: transformStripePrice },
    { table: "credit_ledger", convexTable: "credit_ledger", transform: transformCreditLedger },
    { table: "credits_ledger", convexTable: "credits_ledger", transform: transformCreditsLedger },
    { table: "ai_usage_events", convexTable: "ai_usage_events", transform: transformAiUsageEvent },
    { table: "ai_pricing_config", convexTable: "ai_pricing_config", transform: transformAiPricingConfig },
    { table: "support_tickets", convexTable: "support_tickets", transform: transformSupportTicket },
    { table: "support_messages", convexTable: "support_messages", transform: transformSupportMessage },
    { table: "notifications", convexTable: "notifications", transform: transformNotification },
    { table: "feedback", convexTable: "feedback", transform: transformFeedback },
    { table: "showcase_images", convexTable: "showcase_images", transform: transformShowcaseImage },
    { table: "country_pricing", convexTable: "country_pricing", transform: transformCountryPricing },
    { table: "audit_logs", convexTable: "audit_logs", transform: transformAuditLog },
  ];

  const summary: Array<{ table: string; source: number; inserted: number; errors: number }> = [];

  for (const step of migrationSteps) {
    if (TABLE_FILTER && step.table !== TABLE_FILTER) continue;

    const sourceDocs = allDocs[step.convexTable] || [];
    if (sourceDocs.length === 0) {
      continue;
    }

    console.log(`\n  → Migrating "${step.table}" (${sourceDocs.length} rows)...`);

    const rows = sourceDocs.map(step.transform);
    const result = await insertBatch(supabase, step.table, rows);
    summary.push({
      table: step.table,
      source: sourceDocs.length,
      inserted: result.inserted,
      errors: result.errors,
    });

    console.log(
      `    ✓ ${result.inserted} inserted, ${result.errors} errors`
    );
  }

  // ─── Save ID Mappings ────────────────────────────────────────────────────
  const mappingsDir = path.join(EXPORT_DIR, "id-mappings");
  if (!fs.existsSync(mappingsDir)) {
    fs.mkdirSync(mappingsDir, { recursive: true });
  }

  for (const [table, map] of Object.entries(idMaps)) {
    const mappingFile = path.join(mappingsDir, `${table}.json`);
    const mappingData: Record<string, string> = {};
    for (const [convexId, newId] of map) {
      mappingData[convexId] = newId;
    }
    fs.writeFileSync(mappingFile, JSON.stringify(mappingData, null, 2));
  }

  // Save Clerk → Auth mapping
  const clerkMappingFile = path.join(mappingsDir, "clerk-to-supabase-auth.json");
  const clerkMappingData: Record<string, string> = {};
  for (const [clerkId, authId] of clerkToAuthMap) {
    clerkMappingData[clerkId] = authId;
  }
  fs.writeFileSync(clerkMappingFile, JSON.stringify(clerkMappingData, null, 2));

  // Save storage mappings
  const storageMappingFile = path.join(mappingsDir, "storage-id-to-path.json");
  const storageMappingData: Record<string, string> = {};
  for (const [storageId, storagePath] of storageIdToPath) {
    storageMappingData[storageId] = storagePath;
  }
  fs.writeFileSync(storageMappingFile, JSON.stringify(storageMappingData, null, 2));

  console.log(`\n  ID mappings saved to ${mappingsDir}/`);

  // ─── Final Summary ──────────────────────────────────────────────────────
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║   Migration Summary                                   ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  console.log("  Table                    Source → Inserted (Errors)");
  console.log("  ─────────────────────────────────────────────────────");
  let totalSource = 0;
  let totalInserted = 0;
  let totalErrors = 0;
  for (const row of summary) {
    const pad = 25 - row.table.length;
    console.log(
      `  ${row.table}${" ".repeat(pad)}${row.source} → ${row.inserted} (${row.errors} errors)`
    );
    totalSource += row.source;
    totalInserted += row.inserted;
    totalErrors += row.errors;
  }
  console.log("  ─────────────────────────────────────────────────────");
  console.log(
    `  TOTAL                    ${totalSource} → ${totalInserted} (${totalErrors} errors)`
  );

  if (totalErrors > 0) {
    console.log("\n  ⚠ Some rows failed to insert. Check logs above for details.");
  }

  console.log("\n  Next steps:");
  console.log("  1. Send password reset emails to all users");
  console.log("  2. Update Stripe webhook URL in Stripe Dashboard");
  console.log("  3. Verify data integrity with spot checks");
  console.log("  4. Test end-to-end flows\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
