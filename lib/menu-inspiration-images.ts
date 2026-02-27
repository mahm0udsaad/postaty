"use server";

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { MenuCategory, CampaignType } from "./types";

// ── Category to directory mapping ──────────────────────────────
// Restaurant category loads from both "resturants" and "cafe" dirs

const MENU_CATEGORY_DIRS: Record<MenuCategory, string[]> = {
  restaurant: ["resturants", "cafe"],
  supermarket: ["supermarket"],
};

const MENU_INSPIRATIONS_ROOT = join(process.cwd(), "public", "menu-inspiration");
const MAX_IMAGES = 3;
const RESIZE_WIDTH = 540;
const RESIZE_HEIGHT = 764; // A4-like ratio (540 * 1.414)
const JPEG_QUALITY = 70;

export interface MenuInspirationImage {
  type: "image";
  image: Buffer;
  mediaType: "image/jpeg";
}

// ── In-memory cache: dir key → all resized buffers ────────────
const imageCache = new Map<string, Buffer[]>();
const cachePromises = new Map<string, Promise<Buffer[]>>();

async function loadAndCacheDir(dirName: string): Promise<Buffer[]> {
  const cached = imageCache.get(dirName);
  if (cached) return cached;

  const existing = cachePromises.get(dirName);
  if (existing) return existing;

  const promise = (async () => {
    const dir = join(MENU_INSPIRATIONS_ROOT, dirName);

    let filenames: string[];
    try {
      const entries = await readdir(dir);
      filenames = entries.filter(
        (f) => f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".png")
      );
    } catch {
      console.warn(`[menuInspirationImages] Cannot read directory: ${dir}`);
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
 * Select random menu inspiration images for a category.
 * Restaurant loads from both "resturants" and "cafe" directories.
 * First call reads ALL images from disk and caches them.
 * Subsequent calls shuffle and pick — zero I/O.
 */
export async function getMenuInspirationImages(
  menuCategory: MenuCategory,
  count: number = MAX_IMAGES,
  _campaignType: CampaignType = "standard"
): Promise<MenuInspirationImage[]> {
  const dirs = MENU_CATEGORY_DIRS[menuCategory];

  // Load all directories for this category and merge buffers
  const allBufferArrays = await Promise.all(dirs.map((d) => loadAndCacheDir(d)));
  const allBuffers = allBufferArrays.flat();

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
