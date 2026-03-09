"use server";

import { createClient } from "@/lib/supabase/server";
import { generateMenu } from "@/lib/generate-menu";
import { generateMenuMarketingContent } from "@/lib/generate-designs";
import { menuFormDataSchema } from "@/lib/validation";
import { persistExactAiUsageEvent } from "@/lib/ai-cost";
import type { MenuFormData, PosterResult, MarketingContentHub } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";
import type { GenerationUsage } from "@/lib/generate-designs";
import { checkRateLimit } from "@/lib/rate-limit";

function extractUsageFromUnknown(value: unknown): GenerationUsage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const maybeUsage = (value as { usage?: unknown }).usage;
  if (!maybeUsage || typeof maybeUsage !== "object") return undefined;

  const usage = maybeUsage as Partial<GenerationUsage>;
  if (
    (usage.route === "menu" || usage.route === "marketing-content") &&
    typeof usage.model === "string" &&
    (usage.provider === "google_direct" || usage.provider === "vercel_gateway") &&
    typeof usage.providerModelId === "string" &&
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
  brandKit?: BrandKitPromptData,
  generationId?: string
): Promise<{ main: PosterResult; usages: GenerationUsage[] }> {
  // Server-side auth gate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    throw new Error("يجب تسجيل الدخول لإنشاء تصاميم");
  }

  const { allowed } = await checkRateLimit(userId, "menu", 60, 3);
  if (!allowed) {
    throw new Error("لقد تجاوزت الحد المسموح. حاول مرة أخرى بعد دقيقة.");
  }

  // Sanitize: React server action serialization can convert undefined → null
  const sanitized = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === null ? undefined : v])
  ) as MenuFormData;

  const validation = menuFormDataSchema.safeParse(sanitized);
  if (!validation.success) {
    console.error("[generateMenuAction] validation_failed", {
      issues: validation.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
        received: (i as { received?: unknown }).received,
      })),
    });
    throw new Error(
      `Validation failed: ${validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`
    );
  }

  console.info("[generateMenuAction] start", {
    menuCategory: sanitized.menuCategory,
    itemCount: sanitized.items.length,
    userId,
  });

  const usages: GenerationUsage[] = [];

  try {
    const design = await generateMenu(sanitized, brandKit);
    usages.push(design.usage);
    try {
      await persistExactAiUsageEvent({
        userAuthId: userId,
        generationId,
        generationType: "menu",
        route: design.usage.route,
        model: design.usage.model,
        provider: design.usage.provider,
        providerModelId: design.usage.providerModelId,
        inputTokens: design.usage.inputTokens,
        outputTokens: design.usage.outputTokens,
        imagesGenerated: design.usage.imagesGenerated,
        durationMs: design.usage.durationMs,
        success: design.usage.success,
        error: design.usage.error ?? null,
      });
    } catch (usageErr) {
      console.error("[generateMenuAction] failed to persist exact usage", usageErr);
    }
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
    if (errUsage) {
      usages.push(errUsage);
      try {
        await persistExactAiUsageEvent({
          userAuthId: userId,
          generationId,
          generationType: "menu",
          route: errUsage.route,
          model: errUsage.model,
          provider: errUsage.provider,
          providerModelId: errUsage.providerModelId,
          inputTokens: errUsage.inputTokens,
          outputTokens: errUsage.outputTokens,
          imagesGenerated: errUsage.imagesGenerated,
          durationMs: errUsage.durationMs,
          success: errUsage.success,
          error: errUsage.error ?? null,
        });
      } catch (usageErr) {
        console.error("[generateMenuAction] failed to persist exact usage", usageErr);
      }
    }

    const errorMessage = err instanceof Error ? err.message : "Menu generation failed";
    let errorType: "quota" | "capacity" | "generation" = "generation";
    if (/quota|exceeded.*quota|429|resource exhausted/i.test(errorMessage)) {
      errorType = "quota";
    } else if (/capacity|overloaded|503|high demand/i.test(errorMessage)) {
      errorType = "capacity";
    }

    const main: PosterResult = {
      designIndex: 0,
      format: "instagram-square",
      html: "",
      status: "error",
      error: errorMessage,
      errorType,
      designName: "Menu Design",
      designNameAr: "تصميم قائمة",
    };

    return { main, usages };
  }
}

export async function generateMenuMarketingContentAction(
  data: MenuFormData,
  language: string = "auto",
  generationId?: string
): Promise<{ content: MarketingContentHub; usage: GenerationUsage } | { error: string }> {
  let userId: string | undefined;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
    if (!userId) return { error: "Authentication required" };

    const result = await generateMenuMarketingContent(data, language);
    try {
      await persistExactAiUsageEvent({
        userAuthId: userId,
        generationId,
        generationType: "marketing-content",
        route: result.usage.route,
        model: result.usage.model,
        provider: result.usage.provider,
        providerModelId: result.usage.providerModelId,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        imagesGenerated: result.usage.imagesGenerated,
        durationMs: result.usage.durationMs,
        success: result.usage.success,
        error: result.usage.error ?? null,
      });
    } catch (usageErr) {
      console.error("[generateMenuMarketingContentAction] failed to persist exact usage", usageErr);
    }
    const { usage, ...content } = result;
    return { content, usage };
  } catch (err) {
    console.warn("[generateMenuMarketingContentAction] failed (non-blocking)", err);
    const usage = extractUsageFromUnknown(err);
    if (userId && usage) {
      try {
        await persistExactAiUsageEvent({
          userAuthId: userId,
          generationId,
          generationType: "marketing-content",
          route: usage.route,
          model: usage.model,
          provider: usage.provider,
          providerModelId: usage.providerModelId,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          imagesGenerated: usage.imagesGenerated,
          durationMs: usage.durationMs,
          success: usage.success,
          error: usage.error ?? null,
        });
      } catch (usageErr) {
        console.error("[generateMenuMarketingContentAction] failed to persist exact usage", usageErr);
      }
    }
    return { error: err instanceof Error ? err.message : "Marketing content generation failed" };
  }
}
