"use server";

import { auth } from "@clerk/nextjs/server";
import { generatePoster, generateGiftImage } from "@/lib/generate-designs";
import { removeBackgroundWithFallback } from "@/lib/gift-editor/remove-background";
import { postFormDataSchema } from "@/lib/validation";
import type { PostFormData, OutputFormat, GeneratePostersResult } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";
import type { GenerationUsage } from "@/lib/generate-designs";

function extractUsageFromUnknown(value: unknown): GenerationUsage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const maybeUsage = (value as { usage?: unknown }).usage;
  if (!maybeUsage || typeof maybeUsage !== "object") return undefined;

  const usage = maybeUsage as Partial<GenerationUsage>;
  if (
    (usage.route === "poster" || usage.route === "gift") &&
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

/** Generate main poster + gift image in parallel */
export async function generatePosters(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): Promise<GeneratePostersResult & { usages: GenerationUsage[] }> {
  // Server-side auth gate — block unauthenticated requests
  const { userId } = await auth();
  if (!userId) {
    throw new Error("يجب تسجيل الدخول لإنشاء تصاميم");
  }

  const validation = postFormDataSchema.safeParse(data);
  if (!validation.success) {
    console.error("[generatePosters] validation_failed", {
      issues: validation.error.issues.map((i) => i.message),
    });
    throw new Error(
      `Validation failed: ${validation.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const format: OutputFormat = data.formats[0];

  console.info("[generatePosters] start", { category: data.category, userId });

  const usages: GenerationUsage[] = [];

  // Run main poster and gift image in parallel
  const [mainResult, giftResult] = await Promise.allSettled([
    generatePoster(data, brandKit),
    generateGiftImage(data),
  ]);

  // Build main poster result
  let main: GeneratePostersResult["main"];
  if (mainResult.status === "fulfilled") {
    const design = mainResult.value;
    usages.push(design.usage);
    console.info("[generatePosters] main success");
    main = {
      designIndex: 0,
      format,
      html: "",
      imageBase64: design.imageBase64,
      status: "complete" as const,
      designName: design.name,
      designNameAr: design.nameAr,
    };
  } else {
    console.error("[generatePosters] main failed", mainResult.reason);
    const errUsage = extractUsageFromUnknown(mainResult.reason);
    if (errUsage) usages.push(errUsage);
    main = {
      designIndex: 0,
      format,
      html: "",
      status: "error",
      error:
        mainResult.reason instanceof Error
          ? mainResult.reason.message
          : "Generation failed",
      designName: "AI Design",
      designNameAr: "تصميم بالذكاء الاصطناعي",
    };
  }

  // Build gift result (non-blocking — gift failure doesn't affect main)
  let gift: GeneratePostersResult["gift"];
  if (giftResult.status === "fulfilled") {
    const design = giftResult.value;
    usages.push(design.usage);
    console.info("[generatePosters] gift success");
    gift = {
      designIndex: 1,
      format,
      html: "",
      imageBase64: design.imageBase64,
      status: "complete" as const,
      designName: design.name,
      designNameAr: design.nameAr,
      isGift: true,
    };
  } else {
    console.warn("[generatePosters] gift failed (non-blocking)", giftResult.reason);
    const errUsage = extractUsageFromUnknown(giftResult.reason);
    if (errUsage) usages.push(errUsage);
  }

  return { main, gift, usages };
}

export async function removeOverlayBackground(
  base64: string
): Promise<{ imageBase64: string; method: "ai" | "fallback"; warning?: string }> {
  if (!base64 || typeof base64 !== "string") {
    throw new Error("Overlay image is required");
  }

  return removeBackgroundWithFallback(base64);
}
