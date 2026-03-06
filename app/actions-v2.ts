"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePoster, generateMarketingContent } from "@/lib/generate-designs";
import { getInspirationImages } from "@/lib/inspiration-images";
import { removeBackgroundWithFallback } from "@/lib/gift-editor/remove-background";
import { postFormDataSchema } from "@/lib/validation";
import type { PostFormData, OutputFormat, GeneratePostersResult, MarketingContentHub, Category, CampaignType } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";
import type { GenerationUsage } from "@/lib/generate-designs";
import { checkRateLimit } from "@/lib/rate-limit";

function extractUsageFromUnknown(value: unknown): GenerationUsage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const maybeUsage = (value as { usage?: unknown }).usage;
  if (!maybeUsage || typeof maybeUsage !== "object") return undefined;

  const usage = maybeUsage as Partial<GenerationUsage>;
  if (
    (usage.route === "poster" || usage.route === "gift" || usage.route === "marketing-content" || usage.route === "menu") &&
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

  const { allowed } = await checkRateLimit(userId, "generate", 60, 5);
  if (!allowed) {
    throw new Error("لقد تجاوزت الحد المسموح. حاول مرة أخرى بعد دقيقة.");
  }

  // Sanitize: React server action serialization can convert undefined → null
  const sanitized = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === null ? undefined : v])
  ) as PostFormData;

  const validation = postFormDataSchema.safeParse(sanitized);
  if (!validation.success) {
    console.error("[generatePosters] validation_failed", {
      issues: validation.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
        received: (i as any).received,
      })),
    });
    throw new Error(
      `Validation failed: ${validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`
    );
  }

  const format: OutputFormat = sanitized.format;

  console.info("[generatePosters] start", { category: sanitized.category, userId });

  const usages: GenerationUsage[] = [];

  // Generate main poster only (gift removed, marketing content generated separately)
  try {
    const design = await generatePoster(sanitized, brandKit);
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

    const errorMessage = err instanceof Error ? err.message : "Generation failed";
    let errorType: "quota" | "capacity" | "generation" = "generation";
    if (/quota|exceeded.*quota|429|resource exhausted/i.test(errorMessage)) {
      errorType = "quota";
    } else if (/capacity|overloaded|503|high demand/i.test(errorMessage)) {
      errorType = "capacity";
    }

    const main: GeneratePostersResult["main"] = {
      designIndex: 0,
      format,
      html: "",
      status: "error",
      error: errorMessage,
      errorType,
      designName: "AI Design",
      designNameAr: "تصميم بالذكاء الاصطناعي",
    };

    return { main, usages };
  }
}

/** Generate marketing content for all social platforms (called AFTER poster is ready, no credit cost) */
export async function generateMarketingContentAction(
  data: PostFormData,
  language: string = "auto"
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

export async function prewarmGenerationAssets(input: {
  category: Category;
  campaignType: CampaignType;
  subType?: string;
}): Promise<{ ok: true }> {
  try {
    const subType = input.category === "services" ? input.subType : undefined;
    await getInspirationImages(input.category, 1, input.campaignType, subType);
  } catch (err) {
    console.warn("[prewarmGenerationAssets] non-blocking failure", err);
  }
  return { ok: true };
}
