#!/usr/bin/env npx tsx
/**
 * Migrate Convex storage files to Supabase Storage.
 *
 * Step 1: Use Convex client to resolve storageIds → download URLs
 * Step 2: Download each file
 * Step 3: Upload to Supabase Storage
 * Step 4: Update database records with public URLs
 *
 * Prerequisites:
 * - Deploy convex/migrationHelper.ts first: npx convex dev --once
 * - Ensure .env.local has CONVEX and SUPABASE credentials
 *
 * Usage: npx tsx scripts/migrate-files.ts [--dry-run]
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DRY_RUN = process.argv.includes("--dry-run");

const convex = new ConvexHttpClient(CONVEX_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
}) as any;

const EXPORT_DIR = path.resolve(process.cwd(), "convex-export-data");

function readTable(name: string): any[] {
  const p = path.join(EXPORT_DIR, name, "documents.jsonl");
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf-8").split("\n").filter(l => l.trim()).map(l => JSON.parse(l));
}

interface FileRef {
  storageId: string;
  bucket: string;
}

function collectStorageRefs(): Map<string, FileRef> {
  const refs = new Map<string, FileRef>();

  for (const gen of readTable("generations")) {
    for (const out of gen.outputs || []) {
      if (out.storageId) refs.set(out.storageId, { storageId: out.storageId, bucket: "generations" });
    }
  }
  for (const bk of readTable("brand_kits")) {
    if (bk.logoStorageId) refs.set(bk.logoStorageId, { storageId: bk.logoStorageId, bucket: "logos" });
  }
  for (const u of readTable("users")) {
    if (u.logoStorageId) refs.set(u.logoStorageId, { storageId: u.logoStorageId, bucket: "logos" });
  }
  for (const t of readTable("templates")) {
    if (t.previewStorageId) refs.set(t.previewStorageId, { storageId: t.previewStorageId, bucket: "previews" });
  }
  for (const pt of readTable("poster_templates")) {
    if (pt.previewStorageId) refs.set(pt.previewStorageId, { storageId: pt.previewStorageId, bucket: "previews" });
  }
  for (const si of readTable("showcase_images")) {
    if (si.storageId) refs.set(si.storageId, { storageId: si.storageId, bucket: "showcase" });
  }
  for (const fb of readTable("feedback")) {
    if (fb.imageStorageId) refs.set(fb.imageStorageId, { storageId: fb.imageStorageId, bucket: "feedback" });
  }
  for (const pj of readTable("poster_jobs")) {
    for (const r of pj.results || []) {
      if (r.storageId) refs.set(r.storageId, { storageId: r.storageId, bucket: "generations" });
    }
  }
  return refs;
}

async function resolveStorageUrls(storageIds: string[]): Promise<Record<string, string | null>> {
  console.log(`  Resolving ${storageIds.length} storage URLs via Convex...`);

  // Batch in groups of 20
  const allUrls: Record<string, string | null> = {};
  for (let i = 0; i < storageIds.length; i += 20) {
    const batch = storageIds.slice(i, i + 20);
    try {
      const result = await convex.query(api.migrationHelper.getStorageUrls, {
        storageIds: batch as any,
      });
      Object.assign(allUrls, result);
    } catch (err: any) {
      console.error(`  ✗ Failed to resolve batch ${Math.floor(i / 20) + 1}: ${err.message}`);
      for (const id of batch) allUrls[id] = null;
    }
  }

  const resolved = Object.values(allUrls).filter(Boolean).length;
  console.log(`  Resolved ${resolved}/${storageIds.length} URLs.`);
  return allUrls;
}

async function downloadFile(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ⚠ Download failed (${res.status}): ${url.slice(0, 80)}...`);
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (err: any) {
    console.warn(`  ⚠ Download error: ${err.message}`);
    return null;
  }
}

async function uploadToSupabase(buffer: Buffer, bucket: string, storagePath: string): Promise<boolean> {
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would upload ${bucket}/${storagePath} (${(buffer.length / 1024).toFixed(0)} KB)`);
    return true;
  }

  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: "image/png",
    upsert: true,
  });

  if (error) {
    console.error(`  ✗ Upload failed ${bucket}/${storagePath}: ${error.message}`);
    return false;
  }
  return true;
}

async function updateImageUrls() {
  console.log("\n═══ Phase 3: Updating Image URLs in Database ═══\n");

  // Update generations outputs with public URLs
  const { data: gens } = await supabase.from("generations").select("id, outputs");
  let updatedGens = 0;

  for (const gen of gens || []) {
    const outputs = gen.outputs || [];
    let changed = false;

    const updatedOutputs = outputs.map((out: any) => {
      if (out.storage_path) {
        const { data } = supabase.storage.from("generations").getPublicUrl(out.storage_path);
        changed = true;
        return { ...out, url: data.publicUrl };
      }
      return out;
    });

    if (changed && !DRY_RUN) {
      await supabase.from("generations").update({ outputs: updatedOutputs }).eq("id", gen.id);
      updatedGens++;
    }
  }
  console.log(`  Updated ${updatedGens} generation records with public URLs.`);
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║   Convex → Supabase File Migration                   ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  if (DRY_RUN) console.log("  *** DRY RUN MODE ***\n");

  // Step 1: Collect all storage references
  const refs = collectStorageRefs();
  console.log(`Found ${refs.size} unique storage files to migrate.\n`);

  const bucketCounts: Record<string, number> = {};
  for (const ref of refs.values()) {
    bucketCounts[ref.bucket] = (bucketCounts[ref.bucket] || 0) + 1;
  }
  for (const [bucket, count] of Object.entries(bucketCounts)) {
    console.log(`  ${bucket}: ${count} files`);
  }

  // Step 2: Resolve storage URLs via Convex API
  console.log("\n═══ Phase 1: Resolving Convex Storage URLs ═══\n");
  const storageIds = Array.from(refs.keys());
  const urlMap = await resolveStorageUrls(storageIds);

  // Step 3: Download and upload files
  console.log("\n═══ Phase 2: Downloading & Uploading Files ═══\n");

  let migrated = 0;
  let failed = 0;
  let skipped = 0;
  let i = 0;

  for (const [storageId, ref] of refs) {
    i++;
    const downloadUrl = urlMap[storageId];
    const storagePath = `migrated/${storageId}.png`;

    if (!downloadUrl) {
      console.warn(`  ⚠ No URL for ${storageId}, skipping.`);
      skipped++;
      continue;
    }

    // Download from Convex
    const buffer = await downloadFile(downloadUrl);
    if (!buffer) {
      failed++;
      continue;
    }

    // Upload to Supabase
    const ok = await uploadToSupabase(buffer, ref.bucket, storagePath);
    if (ok) {
      migrated++;
    } else {
      failed++;
    }

    if (i % 5 === 0 || i === refs.size) {
      console.log(`  Progress: ${i}/${refs.size} (${migrated} OK, ${failed} failed, ${skipped} skipped)`);
    }
  }

  console.log(`\n  Files: ${migrated} migrated, ${failed} failed, ${skipped} skipped, ${refs.size} total`);

  // Step 4: Update database URLs
  await updateImageUrls();

  console.log("\n  Done!\n");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
