"use server";

import { generateObject, generateText } from "ai";
import { gateway } from "@/lib/ai";
import { posterDesignSchema, type PosterDesign } from "./poster-design-schema";
import {
  getPosterDesignSystemPrompt,
  getPosterDesignUserMessage,
  getImageDesignSystemPrompt,
  getImageDesignUserMessage,
} from "./poster-prompts";
import { formatRecipeForPrompt, type DesignRecipe } from "./design-recipes";
import { getInspirationImages } from "./inspiration-images";
import type { PostFormData } from "./types";
import type { BrandKitPromptData } from "./prompts";

// ── Types ──────────────────────────────────────────────────────────

export type GeneratedDesign = PosterDesign & { imageBase64?: string };

// ── Model Pool ──────────────────────────────────────────────────

const MODEL_POOL = [
    "google/gemini-3-flash",
    "google/gemini-3-flash",
    "google/gemini-3-flash",
    "google/gemini-3-pro-image",
];

const IMAGE_MODELS = new Set(["google/gemini-3-pro-image"]);

// ── Helpers ──────────────────────────────────────────────────────

function dataUrlToImagePart(dataUrl: string): { image: Buffer; mediaType: string } | null {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    image: Buffer.from(match[2], "base64"),
    mediaType: match[1],
  };
}

function extractFormImages(data: PostFormData): { product: string; logo: string } {
  switch (data.category) {
    case "restaurant":
      return { product: data.mealImage, logo: data.logo };
    case "supermarket":
      return { product: data.productImages[0], logo: data.logo };
    case "online":
      return { product: data.productImage, logo: data.logo };
  }
}

// ── Generate a single poster design ─────────────────────────────

export async function generateSingleDesign(
  data: PostFormData,
  styleIndex: number,
  brandKit?: BrandKitPromptData,
  recipe?: DesignRecipe
): Promise<GeneratedDesign> {
  const modelId = MODEL_POOL[styleIndex % MODEL_POOL.length];

  // Route to image generation for image models
  if (IMAGE_MODELS.has(modelId)) {
    return generateImageDesign(data, styleIndex, modelId, brandKit, recipe);
  }

  const systemPrompt = getPosterDesignSystemPrompt(data, brandKit);
  const userMessage = getPosterDesignUserMessage(data);

  // Build the full prompt with recipe directive
  let fullPrompt = userMessage;

  if (recipe) {
    const recipeDirective = formatRecipeForPrompt(recipe, data.campaignType);
    fullPrompt += `\n\n${recipeDirective}`;
  }

  fullPrompt += `\n\nVariation key: ${styleIndex + 1}. Make this design unique and visually striking.`;

  // Load inspiration images for this category
  const inspirationStart = Date.now();
  const inspirationImages = await getInspirationImages(data.category);
  console.info("[generateSingleDesign] inspirations_loaded", {
    styleIndex,
    count: inspirationImages.length,
    durationMs: Date.now() - inspirationStart,
  });

  console.info("[generateSingleDesign] start", {
    category: data.category,
    styleIndex,
    model: modelId,
    recipe: recipe?.id ?? "none",
    inspirationCount: inspirationImages.length,
  });

  const shared = {
    model: gateway(modelId),
    schema: posterDesignSchema,
    system: systemPrompt,
    temperature: 0.9,
  };

  // Text-only helper for fallback
  const generateTextOnly = () =>
    generateObject({ ...shared, prompt: fullPrompt });

  if (inspirationImages.length > 0) {
    const inspirationText =
      `Here are ${inspirationImages.length} professional reference poster designs. ` +
      `These set your quality standard. Study their color palettes, spatial composition, typographic boldness, and decorative restraint. ` +
      `Your design must feel like it belongs in this same collection — matching their polish and visual impact while being completely original.`;

    try {
      const result = await generateObject({
        ...shared,
        messages: [
          {
            role: "user" as const,
            content: [
              ...inspirationImages.map((img) => ({
                type: "image" as const,
                image: img.image,
                mediaType: img.mediaType,
              })),
              {
                type: "text" as const,
                text: `${inspirationText}\n\n${fullPrompt}`,
              },
            ],
          },
        ],
      });

      console.info("[generateSingleDesign] success", {
        styleIndex,
        model: modelId,
        htmlLength: result.object.html?.length ?? 0,
        name: result.object.name,
      });

      return result.object;
    } catch (error) {
      // If multimodal failed, retry without images
      console.warn("[generateSingleDesign] multimodal failed, retrying text-only", {
        styleIndex,
        model: modelId,
        error: error instanceof Error ? error.message : String(error),
      });
      const fallbackResult = await generateTextOnly();
      return fallbackResult.object;
    }
  }

  const result = await generateTextOnly();

  console.info("[generateSingleDesign] success", {
    styleIndex,
    model: modelId,
    htmlLength: result.object.html?.length ?? 0,
    name: result.object.name,
  });

  return result.object;
}

// ── Generate a poster as an AI-generated image ───────────────────

async function generateImageDesign(
  data: PostFormData,
  styleIndex: number,
  modelId: string,
  brandKit?: BrandKitPromptData,
  recipe?: DesignRecipe
): Promise<GeneratedDesign> {
  const systemPrompt = getImageDesignSystemPrompt(data, brandKit);
  let userMessage = getImageDesignUserMessage(data);

  if (recipe) {
    const recipeDirective = formatRecipeForPrompt(recipe, data.campaignType);
    userMessage += `\n\n${recipeDirective}`;
  }

  userMessage += `\n\nMake this design unique, bold, and visually striking.`;

  // Load inspiration images and extract form images
  const inspirationImages = await getInspirationImages(data.category);
  const formImages = extractFormImages(data);

  console.info("[generateImageDesign] start", {
    styleIndex,
    model: modelId,
    recipe: recipe?.id ?? "none",
    inspirationCount: inspirationImages.length,
  });

  // Build multimodal content parts
  const contentParts: Array<
    | { type: "image"; image: Buffer; mediaType: string }
    | { type: "text"; text: string }
  > = [];

  // Add inspiration images
  for (const img of inspirationImages) {
    contentParts.push({
      type: "image" as const,
      image: img.image,
      mediaType: img.mediaType,
    });
  }

  // Add product image
  const productPart = dataUrlToImagePart(formImages.product);
  if (productPart) {
    contentParts.push({
      type: "image" as const,
      image: productPart.image,
      mediaType: productPart.mediaType,
    });
  }

  // Add logo image
  const logoPart = dataUrlToImagePart(formImages.logo);
  if (logoPart) {
    contentParts.push({
      type: "image" as const,
      image: logoPart.image,
      mediaType: logoPart.mediaType,
    });
  }

  // Build context text explaining each image
  let contextText = "";
  if (inspirationImages.length > 0) {
    contextText += `The first ${inspirationImages.length} image(s) are professional reference posters — match their quality and style.\n\n`;
  }
  if (productPart) {
    contextText += `The ${inspirationImages.length > 0 ? "next" : "first"} image is the product/meal photo — feature it prominently in the poster.\n`;
  }
  if (logoPart) {
    contextText += `The last image is the business logo — include it in the poster.\n`;
  }
  contextText += `\n${userMessage}`;

  contentParts.push({ type: "text" as const, text: contextText });

  const result = await generateText({
    model: gateway(modelId),
    system: systemPrompt,
    messages: [
      {
        role: "user" as const,
        content: contentParts,
      },
    ],
    providerOptions: {
      google: { responseModalities: ["TEXT", "IMAGE"] },
    },
  });

  // Extract generated image from result
  const files = (result as unknown as Record<string, unknown>).files as
    | Array<{ mediaType: string; base64: string }>
    | undefined;

  const imageFile = files?.find((f) => f.mediaType?.startsWith("image/"));

  if (!imageFile) {
    throw new Error("Image model did not return an image");
  }

  const base64DataUrl = `data:${imageFile.mediaType};base64,${imageFile.base64}`;

  console.info("[generateImageDesign] success", {
    styleIndex,
    model: modelId,
    imageSize: imageFile.base64.length,
  });

  return {
    name: `AI Image ${styleIndex + 1}`,
    nameAr: `تصميم ذكي ${styleIndex + 1}`,
    html: "",
    imageBase64: base64DataUrl,
  };
}
