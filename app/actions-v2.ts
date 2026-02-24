"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePoster, generateGiftImage, generateMarketingContent } from "@/lib/generate-designs";
import { removeBackgroundWithFallback } from "@/lib/gift-editor/remove-background";
import { postFormDataSchema } from "@/lib/validation";
import type { PostFormData, OutputFormat, GeneratePostersResult, MarketingContent } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";
import type { GenerationUsage } from "@/lib/generate-designs";

// Simple in-memory rate limiter: max 5 requests per minute per user
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, number[]>();

// Server-side poster store: keeps poster base64 in memory so the client
// can request marketing content without re-sending the massive base64 string.
const POSTER_STORE_TTL_MS = 5 * 60_000; // 5 minutes
const posterStore = new Map<string, { base64: string; createdAt: number }>();

function cleanPosterStore(): void {
  const now = Date.now();
  for (const [key, entry] of posterStore) {
    if (now - entry.createdAt > POSTER_STORE_TTL_MS) {
      posterStore.delete(key);
    }
  }
}

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    throw new Error("لقد تجاوزت الحد المسموح. حاول مرة أخرى بعد دقيقة.");
  }

  recent.push(now);
  rateLimitMap.set(userId, recent);
}

function extractUsageFromUnknown(value: unknown): GenerationUsage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const maybeUsage = (value as { usage?: unknown }).usage;
  if (!maybeUsage || typeof maybeUsage !== "object") return undefined;

  const usage = maybeUsage as Partial<GenerationUsage>;
  if (
    (usage.route === "poster" || usage.route === "gift" || usage.route === "marketing") &&
    typeof usage.model === "string" &&
    typeof usage.inputTokens === "number" &&
    typeof usage.outputTokens === "number" &&
    typeof usage.imagesGenerated === "number" &&
    typeof usage.durationMs === "number" &&
    typeof usage.success === "boolean"
  ) {
    return usage as GenerationUsage;
  }
  return undefined;
}

/** Generate main poster — returns immediately so the UI can show the image.
 *  Stores poster base64 server-side and returns a `posterRef` key so the
 *  client can request marketing content without re-sending the massive base64. */
export async function generatePosters(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): Promise<GeneratePostersResult & { usages: GenerationUsage[]; posterRef?: string }> {
  // Server-side auth gate — block unauthenticated requests
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    throw new Error("يجب تسجيل الدخول لإنشاء تصاميم");
  }

  checkRateLimit(userId);

  const validation = postFormDataSchema.safeParse(data);
  if (!validation.success) {
    console.error("[generatePosters] validation_failed", {
      issues: validation.error.issues.map((i) => i.message),
    });
    throw new Error(
      `Validation failed: ${validation.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const format: OutputFormat = data.format;

  console.info("[generatePosters] start", { category: data.category, userId });

  const usages: GenerationUsage[] = [];

  // Generate main poster
  try {
    const design = await generatePoster(data, brandKit);
    usages.push(design.usage);
    console.info("[generatePosters] main success");

    const main: GeneratePostersResult["main"] = {
      designIndex: 0,
      format,
      html: "",
      imageBase64: design.imageBase64,
      status: "complete" as const,
      designName: design.name,
      designNameAr: design.nameAr,
    };

    // Store poster base64 server-side for the follow-up marketing content call
    const posterRef = `pr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    posterStore.set(posterRef, { base64: design.imageBase64, createdAt: Date.now() });
    cleanPosterStore();

    return { main, usages, posterRef };
  } catch (err) {
    console.error("[generatePosters] main failed", err);
    const errUsage = extractUsageFromUnknown(err);
    if (errUsage) usages.push(errUsage);

    const main: GeneratePostersResult["main"] = {
      designIndex: 0,
      format,
      html: "",
      status: "error",
      error: err instanceof Error ? err.message : "Generation failed",
      designName: "AI Design",
      designNameAr: "تصميم بالذكاء الاصطناعي",
    };

    return { main, usages };
  }
}

/** Generate marketing content using a server-side poster reference (no base64 over the wire). */
export async function generateMarketingContentAction(
  posterRef: string,
  data: PostFormData
): Promise<{ content: MarketingContent; usage: GenerationUsage }> {
  // Auth gate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error("يجب تسجيل الدخول");
  }

  const entry = posterStore.get(posterRef);
  if (!entry) {
    throw new Error("انتهت صلاحية المرجع. يرجى إعادة إنشاء التصميم.");
  }

  // Clean up after retrieval (one-time use)
  posterStore.delete(posterRef);

  return generateMarketingContent(entry.base64, data);
}


export async function removeOverlayBackground(
  base64: string
): Promise<{ imageBase64: string; method: "ai" | "fallback"; warning?: string }> {
  if (!base64 || typeof base64 !== "string") {
    throw new Error("Overlay image is required");
  }

  return removeBackgroundWithFallback(base64);
}
