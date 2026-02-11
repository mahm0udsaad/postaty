"use server";

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Category } from "./types";

// ── Category to directory mapping ──────────────────────────────

const CATEGORY_DIRS: Record<Category, string> = {
  restaurant: "food",
  supermarket: "supermarkets",
  online: "products",
};

const INSPIRATIONS_ROOT = join(process.cwd(), "public", "inspirations");
const MAX_IMAGES = 2;
const RESIZE_WIDTH = 540;
const RESIZE_HEIGHT = 675;
const JPEG_QUALITY = 70;

export interface InspirationImage {
  type: "image";
  image: Buffer;
  mediaType: "image/jpeg";
}

// ── In-memory cache: category → all resized buffers ────────────
// Populated once per category on first call, then reused forever.

const imageCache = new Map<Category, Buffer[]>();
const cachePromises = new Map<Category, Promise<Buffer[]>>();

async function loadAndCacheCategory(category: Category): Promise<Buffer[]> {
  // Return cached result if available
  const cached = imageCache.get(category);
  if (cached) return cached;

  // Deduplicate concurrent loads for the same category
  const existing = cachePromises.get(category);
  if (existing) return existing;

  const promise = (async () => {
    const dir = join(INSPIRATIONS_ROOT, CATEGORY_DIRS[category]);

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

    imageCache.set(category, buffers);
    cachePromises.delete(category);
    return buffers;
  })();

  cachePromises.set(category, promise);
  return promise;
}

/**
 * Select random inspiration images for a category.
 * First call reads ALL images from disk and caches them.
 * Subsequent calls shuffle the cached array and pick `count` items — zero I/O.
 */
export async function getInspirationImages(
  category: Category,
  count: number = MAX_IMAGES
): Promise<InspirationImage[]> {
  const allBuffers = await loadAndCacheCategory(category);
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
