"use server";

import {
  generateSingleDesign,
  generateNanoBananaDesign,
} from "@/lib/generate-designs";
import { selectRecipes, type DesignRecipe } from "@/lib/design-recipes";
import { postFormDataSchema } from "@/lib/validation";
import type { PostFormData, OutputFormat, PosterResult } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";

/** Generate two posters in parallel: one via Gemini, one via NanoBanana Pro */
export async function generatePosters(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): Promise<PosterResult[]> {
  const validation = postFormDataSchema.safeParse(data);
  if (!validation.success) {
    console.error("[generatePosters] validation_failed", {
      issues: validation.error.issues.map((i) => i.message),
    });
    throw new Error(
      `Validation failed: ${validation.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const [recipe] = selectRecipes(data.category, 1);
  const format: OutputFormat = data.formats[0];

  console.info("[generatePosters] start", { category: data.category });

  // Run both generations in parallel
  const [geminiResult, nanoBananaResult] = await Promise.allSettled([
    generateGeminiPoster(data, format, brandKit, recipe),
    generateNanoBananaPoster(data, format, brandKit),
  ]);

  const results: PosterResult[] = [];

  if (geminiResult.status === "fulfilled") {
    results.push(geminiResult.value);
  } else {
    console.error("[generatePosters] gemini failed", geminiResult.reason);
    results.push({
      designIndex: 0,
      format,
      html: "",
      tier: "premium",
      status: "error",
      error: geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini generation failed",
      designName: "Premium AI Design",
      designNameAr: "تصميم مميز",
    });
  }

  if (nanoBananaResult.status === "fulfilled") {
    results.push(nanoBananaResult.value);
  } else {
    console.error("[generatePosters] nanobanana failed", nanoBananaResult.reason);
    results.push({
      designIndex: 1,
      format,
      html: "",
      tier: "standard",
      status: "error",
      error: nanoBananaResult.reason instanceof Error ? nanoBananaResult.reason.message : "NanoBanana generation failed",
      designName: "NanoBanana Pro Design",
      designNameAr: "تصميم نانو بنانا",
    });
  }

  return results;
}

// ── Helpers ────────────────────────────────────────────────────────

async function generateGeminiPoster(
  data: PostFormData,
  format: OutputFormat,
  brandKit: BrandKitPromptData | undefined,
  recipe?: DesignRecipe
): Promise<PosterResult> {
  const design = await generateSingleDesign(data, brandKit, recipe);
  console.info("[generatePosters] gemini success");
  return {
    designIndex: 0,
    format,
    html: "",
    imageBase64: design.imageBase64,
    tier: design.tier,
    status: "complete" as const,
    designName: design.name,
    designNameAr: design.nameAr,
  };
}

async function generateNanoBananaPoster(
  data: PostFormData,
  format: OutputFormat,
  brandKit: BrandKitPromptData | undefined
): Promise<PosterResult> {
  const design = await generateNanoBananaDesign(data, brandKit);
  console.info("[generatePosters] nanobanana success");
  return {
    designIndex: 1,
    format,
    html: "",
    imageBase64: design.imageBase64,
    tier: design.tier,
    status: "complete" as const,
    designName: design.name,
    designNameAr: design.nameAr,
  };
}
