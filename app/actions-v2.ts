"use server";

import { generatePoster, generateGiftImage } from "@/lib/generate-designs";
import { postFormDataSchema } from "@/lib/validation";
import type { PostFormData, OutputFormat, GeneratePostersResult } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";

/** Generate main poster + gift image in parallel */
export async function generatePosters(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): Promise<GeneratePostersResult> {
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

  console.info("[generatePosters] start", { category: data.category });

  // Run main poster and gift image in parallel
  const [mainResult, giftResult] = await Promise.allSettled([
    generatePoster(data, brandKit),
    generateGiftImage(data),
  ]);

  // Build main poster result
  let main: GeneratePostersResult["main"];
  if (mainResult.status === "fulfilled") {
    const design = mainResult.value;
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
    // Gift failure is silent — we don't surface it to the user
  }

  return { main, gift };
}
