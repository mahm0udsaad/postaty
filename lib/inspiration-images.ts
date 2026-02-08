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
const MAX_IMAGES = 3;
const RESIZE_WIDTH = 540;
const RESIZE_HEIGHT = 675;
const JPEG_QUALITY = 70;

export interface InspirationImage {
  type: "image";
  image: Buffer;
  mediaType: "image/jpeg";
}

/**
 * Select up to 3 random inspiration images for a category,
 * read them from disk, and resize to reduce token cost.
 */
export async function getInspirationImages(
  category: Category,
  count: number = MAX_IMAGES
): Promise<InspirationImage[]> {
  const dir = join(INSPIRATIONS_ROOT, CATEGORY_DIRS[category]);

  let filenames: string[];
  try {
    const entries = await readdir(dir);
    filenames = entries.filter(
      (f) => f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".png")
    );
  } catch {
    console.warn(`[getInspirationImages] Cannot read directory: ${dir}`);
    return [];
  }

  if (filenames.length === 0) return [];

  // Fisher-Yates shuffle
  const shuffled = [...filenames];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  const sharp = (await import("sharp")).default;

  const images = await Promise.all(
    selected.map(async (filename) => {
      const filePath = join(dir, filename);
      const raw = await readFile(filePath);
      const resized = await sharp(raw)
        .resize(RESIZE_WIDTH, RESIZE_HEIGHT, { fit: "cover" })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();
      return {
        type: "image" as const,
        image: resized,
        mediaType: "image/jpeg" as const,
      };
    })
  );

  return images;
}
