"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePoster, generateMarketingContent } from "@/lib/generate-designs";
import { removeBackgroundWithFallback } from "@/lib/gift-editor/remove-background";
import { postFormDataSchema } from "@/lib/validation";
import type { PostFormData, OutputFormat, GeneratePostersResult, MarketingContentHub } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";
import type { GenerationUsage } from "@/lib/generate-designs";

// Simple in-memory rate limiter: max 5 requests per minute per user
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, number[]>();

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
    (usage.route === "poster" || usage.route === "gift" || usage.route === "marketing-content") &&
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

/** Generate main poster (marketing content is generated separately after poster completes) */
export async function generatePosters(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): Promise<GeneratePostersResult & { usages: GenerationUsage[] }> {
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

  // Generate main poster only (gift removed, marketing content generated separately)
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

    return { main, usages };
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

/** Generate marketing content for all social platforms (called AFTER poster is ready, no credit cost) */
export async function generateMarketingContentAction(
  data: PostFormData,
  language: "ar" | "en" = "ar"
): Promise<{ content: MarketingContentHub; usage: GenerationUsage } | { error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return { error: "Authentication required" };
    }

    const result = await generateMarketingContent(data, language);
    const { usage, ...content } = result;
    return { content, usage };
  } catch (err) {
    console.warn("[generateMarketingContentAction] failed (non-blocking)", err);
    return { error: err instanceof Error ? err.message : "Marketing content generation failed" };
  }
}

export async function removeOverlayBackground(
  base64: string
): Promise<{ imageBase64: string; method: "ai" | "fallback"; warning?: string }> {
  if (!base64 || typeof base64 !== "string") {
    throw new Error("Overlay image is required");
  }

  return removeBackgroundWithFallback(base64);
}
