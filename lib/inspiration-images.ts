"use server";

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Category, CampaignType } from "./types";

// ── Category to directory mapping ──────────────────────────────

const CATEGORY_DIRS: Record<Category, string> = {
  restaurant: "food",
  supermarket: "supermarkets",
  ecommerce: "products",
  services: "services",
  fashion: "fashion",
  beauty: "beauty",
};

// Seasonal campaign directories (only for categories that have them)
const SEASONAL_DIRS: Partial<Record<Category, Partial<Record<CampaignType, string>>>> = {
  restaurant: { ramadan: "food-ramadan" },
};

const INSPIRATIONS_ROOT = join(process.cwd(), "public", "inspirations");
const MAX_IMAGES = 1;
const RESIZE_WIDTH = 540;
const RESIZE_HEIGHT = 675;
const JPEG_QUALITY = 70;

export interface InspirationImage {
  type: "image";
  image: Buffer;
  mediaType: "image/jpeg";
}

// ── In-memory cache: dir key → all resized buffers ────────────
// Populated once per directory on first call, then reused forever.

const imageCache = new Map<string, Buffer[]>();
const cachePromises = new Map<string, Promise<Buffer[]>>();

async function loadAndCacheDir(dirName: string): Promise<Buffer[]> {
  // Return cached result if available
  const cached = imageCache.get(dirName);
  if (cached) return cached;

  // Deduplicate concurrent loads for the same directory
  const existing = cachePromises.get(dirName);
  if (existing) return existing;

  const promise = (async () => {
    const dir = join(INSPIRATIONS_ROOT, dirName);

    let filenames: string[];
    try {
      const entries = await readdir(dir);
      filenames = entries.filter(
        (f) => f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".png")
      );
    } catch {
      console.warn(`[inspirationImages] Cannot read directory: ${dir}`);
      return [];
    }

    if (filenames.length === 0) return [];

    const sharp = (await import("sharp")).default;

    const buffers = await Promise.all(
      filenames.map(async (filename) => {
        const filePath = join(dir, filename);
        const raw = await readFile(filePath);
        return sharp(raw)
          .resize(RESIZE_WIDTH, RESIZE_HEIGHT, { fit: "cover" })
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer();
      })
    );

    imageCache.set(dirName, buffers);
    cachePromises.delete(dirName);
    return buffers;
  })();

  cachePromises.set(dirName, promise);
  return promise;
}

/**
 * Select random inspiration images for a category.
 * For seasonal campaigns, loads from the seasonal directory if available.
 * When a subType is provided (e.g. serviceType or postType), tries the
 * sub-folder first (e.g. services/travel/) and falls back to the parent.
 * First call reads ALL images from disk and caches them.
 * Subsequent calls shuffle the cached array and pick `count` items — zero I/O.
 */
export async function getInspirationImages(
  category: Category,
  count: number = MAX_IMAGES,
  campaignType: CampaignType = "standard",
  subType?: string
): Promise<InspirationImage[]> {
  // Determine which directory to load from
  let dirName = CATEGORY_DIRS[category];
  if (campaignType !== "standard") {
    const seasonalDir = SEASONAL_DIRS[category]?.[campaignType];
    if (seasonalDir) {
      dirName = seasonalDir;
    }
  }

  // Try sub-type directory first (e.g. services/travel/), fall back to parent
  let allBuffers: Buffer[] = [];
  if (subType) {
    allBuffers = await loadAndCacheDir(`${dirName}/${subType}`);
  }
  if (allBuffers.length === 0) {
    allBuffers = await loadAndCacheDir(dirName);
  }
  if (allBuffers.length === 0) return [];

  // Fisher-Yates shuffle on indices to avoid mutating the cache
  const indices = allBuffers.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const selected = indices.slice(0, Math.min(count, allBuffers.length));

  return selected.map((idx) => ({
    type: "image" as const,
    image: allBuffers[idx],
    mediaType: "image/jpeg" as const,
  }));
}
