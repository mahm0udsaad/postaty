/**
 * Shared image processing helpers for poster and menu generation.
 * NOT a server action file — pure utility functions.
 */

// ── Google provider options for image responses ────────────────────

export function buildImageProviderOptions(aspectRatio: string, imageSize?: "1K" | "2K" | "4K") {
  return {
    google: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio,
        ...(imageSize ? { imageSize } : {}),
      },
    },
  };
}

// ── Image compression helpers ────────────────────────────────────

export async function compressImageFromDataUrl(
  dataUrl: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 75
): Promise<{ image: Buffer; mediaType: "image/jpeg" } | null> {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  const raw = Buffer.from(match[2], "base64");
  const sharp = (await import("sharp")).default;
  const compressed = await sharp(raw)
    .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();
  return { image: compressed, mediaType: "image/jpeg" };
}

export async function compressLogoFromDataUrl(
  dataUrl: string,
  maxWidth = 400,
  maxHeight = 400
): Promise<{ image: Buffer; mediaType: "image/png" } | null> {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  const raw = Buffer.from(match[2], "base64");
  const sharp = (await import("sharp")).default;
  const compressed = await sharp(raw)
    .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
    .png({ quality: 80 })
    .toBuffer();
  return { image: compressed, mediaType: "image/png" };
}
