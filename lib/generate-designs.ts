"use server";

import { generateText } from "ai";
import { gateway } from "@/lib/ai";
import {
  getImageDesignSystemPrompt,
  getImageDesignUserMessage,
  getNanoBananaPrompt,
} from "./poster-prompts";
import { formatRecipeForPrompt, type DesignRecipe } from "./design-recipes";
import { getInspirationImages } from "./inspiration-images";
import { generateNanoBananaImage } from "./nanobanana";
import type { PostFormData } from "./types";
import type { BrandKitPromptData } from "./prompts";

// ── Types ──────────────────────────────────────────────────────────

export type GeneratedDesign = {
  name: string;
  nameAr: string;
  imageBase64: string;
  tier: "premium" | "standard";
};

// ── Model Config ──────────────────────────────────────────────────

const IMAGE_MODEL = "google/gemini-3-pro-image";

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
  brandKit?: BrandKitPromptData,
  recipe?: DesignRecipe
): Promise<GeneratedDesign> {
  return generateImageDesign(data, IMAGE_MODEL, brandKit, recipe);
}

// ── Generate a poster as an AI-generated image ───────────────────

async function generateImageDesign(
  data: PostFormData,
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
  });

  // Extract generated image from result.files (AI SDK v6)
  const imageFile = result.files.find((f) => f.mediaType?.startsWith("image/"));

  if (!imageFile) {
    throw new Error("Image model did not return an image");
  }

  const base64 = Buffer.from(imageFile.uint8Array).toString("base64");
  const base64DataUrl = `data:${imageFile.mediaType};base64,${base64}`;

  console.info("[generateImageDesign] success", {
    model: modelId,
    imageSize: imageFile.base64.length,
  });

  return {
    name: "Premium AI Design",
    nameAr: "تصميم مميز",
    imageBase64: base64DataUrl,
    tier: "premium",
  };
}

// ── Generate a poster using NanoBanana Pro ───────────────────────

export async function generateNanoBananaDesign(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): Promise<GeneratedDesign> {
  const prompt = getNanoBananaPrompt(data, brandKit);

  console.info("[generateNanoBananaDesign] start", { category: data.category });

  const imageBase64 = await generateNanoBananaImage(prompt, {
    resolution: "1K",
    aspectRatio: "1:1",
  });

  console.info("[generateNanoBananaDesign] success");

  return {
    name: "NanoBanana Pro Design",
    nameAr: "تصميم نانو بنانا",
    imageBase64,
    tier: "standard",
  };
}
