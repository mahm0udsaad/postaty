"use server";

import { createClient } from "@/lib/supabase/server";
import { generateMenu } from "@/lib/generate-menu";
import { generateMenuMarketingContent } from "@/lib/generate-designs";
import { menuFormDataSchema } from "@/lib/validation";
import type { MenuFormData, PosterResult, MarketingContentHub } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";
import type { GenerationUsage } from "@/lib/generate-designs";

// Simple in-memory rate limiter: max 3 menu requests per minute per user
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;
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
    usage.route === "menu" &&
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

/** Generate a menu/catalog image */
export async function generateMenuAction(
  data: MenuFormData,
  brandKit?: BrandKitPromptData
): Promise<{ main: PosterResult; usages: GenerationUsage[] }> {
  // Server-side auth gate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    throw new Error("يجب تسجيل الدخول لإنشاء تصاميم");
  }

  checkRateLimit(userId);

  const validation = menuFormDataSchema.safeParse(data);
  if (!validation.success) {
    console.error("[generateMenuAction] validation_failed", {
      issues: validation.error.issues.map((i) => i.message),
    });
    throw new Error(
      `Validation failed: ${validation.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  console.info("[generateMenuAction] start", {
    menuCategory: data.menuCategory,
    itemCount: data.items.length,
    userId,
  });

  const usages: GenerationUsage[] = [];

  try {
    const design = await generateMenu(data, brandKit);
    usages.push(design.usage);
    console.info("[generateMenuAction] success");

    const main: PosterResult = {
      designIndex: 0,
      format: "instagram-square", // placeholder — menu uses A4 but PosterResult expects OutputFormat
      html: "",
      imageBase64: design.imageBase64,
      status: "complete" as const,
      designName: design.name,
      designNameAr: design.nameAr,
    };

    return { main, usages };
  } catch (err) {
    console.error("[generateMenuAction] failed", err);
    const errUsage = extractUsageFromUnknown(err);
    if (errUsage) usages.push(errUsage);

    const main: PosterResult = {
      designIndex: 0,
      format: "instagram-square",
      html: "",
      status: "error",
      error: err instanceof Error ? err.message : "Menu generation failed",
      designName: "Menu Design",
      designNameAr: "تصميم قائمة",
    };

    return { main, usages };
  }
}

export async function generateMenuMarketingContentAction(
  data: MenuFormData,
  language: string = "auto"
): Promise<{ content: MarketingContentHub; usage: GenerationUsage } | { error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return { error: "Authentication required" };

    const result = await generateMenuMarketingContent(data, language);
    const { usage, ...content } = result;
    return { content, usage };
  } catch (err) {
    console.warn("[generateMenuMarketingContentAction] failed (non-blocking)", err);
    return { error: err instanceof Error ? err.message : "Marketing content generation failed" };
  }
}
