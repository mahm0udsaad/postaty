"use server";

import { generatePoster } from "@/lib/generate-designs";
import { postFormDataSchema } from "@/lib/validation";
import type { PostFormData, OutputFormat, PosterResult } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";

/** Generate a single poster via Gemini Pro */
export async function generatePosters(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): Promise<PosterResult> {
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

  try {
    const design = await generatePoster(data, brandKit);
    console.info("[generatePosters] success");
    return {
      designIndex: 0,
      format,
      html: "",
      imageBase64: design.imageBase64,
      status: "complete" as const,
      designName: design.name,
      designNameAr: design.nameAr,
    };
  } catch (err) {
    console.error("[generatePosters] failed", err);
    return {
      designIndex: 0,
      format,
      html: "",
      status: "error",
      error: err instanceof Error ? err.message : "Generation failed",
      designName: "AI Design",
      designNameAr: "تصميم بالذكاء الاصطناعي",
    };
  }
}
