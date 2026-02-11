"use server";

import { generateText } from "ai";
import { gateway } from "@/lib/ai";
import {
  getImageDesignSystemPrompt,
  getImageDesignUserMessage,
  getGiftImageSystemPrompt,
  getGiftImageUserMessage,
} from "./poster-prompts";
import { formatRecipeForPrompt } from "./design-recipes";
import { selectRecipes } from "./design-recipes";
import { getInspirationImages } from "./inspiration-images";
import type { PostFormData } from "./types";
import type { BrandKitPromptData } from "./prompts";

// ── Types ──────────────────────────────────────────────────────────

export type GeneratedDesign = {
  name: string;
  nameAr: string;
  imageBase64: string;
};

// ── Model Config ──────────────────────────────────────────────────

const IMAGE_MODEL = "google/gemini-3-pro-image";
const GIFT_MODEL = "google/gemini-2.5-flash-image";

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

// ── Generate a single poster via Gemini Pro ──────────────────────

export async function generatePoster(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): Promise<GeneratedDesign> {
  const systemPrompt = getImageDesignSystemPrompt(data, brandKit);
  let userMessage = getImageDesignUserMessage(data);

  // Enrich with a design recipe for creative direction
  const [recipe] = selectRecipes(data.category, 1);
  if (recipe) {
    const recipeDirective = formatRecipeForPrompt(recipe, data.campaignType);
    userMessage += `\n\n${recipeDirective}`;
  }

  userMessage += `\n\nMake this design unique, bold, and visually striking.`;

  // Load inspiration images and extract form images
  const inspirationImages = await getInspirationImages(data.category);
  const formImages = extractFormImages(data);

  console.info("[generatePoster] start", {
    model: IMAGE_MODEL,
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

  let result;
  try {
    result = await generateText({
      model: gateway(IMAGE_MODEL),
      system: systemPrompt,
      messages: [
        {
          role: "user" as const,
          content: contentParts,
        },
      ],
    });
  } catch (err) {
    console.error("[generatePoster] generateText threw", err);
    throw new Error(
      `Image generation failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Extract generated image from result.files (AI SDK v6)
  const imageFile = result.files?.find((f) => f.mediaType?.startsWith("image/"));

  if (!imageFile) {
    console.error("[generatePoster] no image in response", {
      filesCount: result.files?.length ?? 0,
      textSnippet: result.text?.slice(0, 200),
    });
    throw new Error("Image model did not return an image");
  }

  const base64 = Buffer.from(imageFile.uint8Array).toString("base64");
  const base64DataUrl = `data:${imageFile.mediaType};base64,${base64}`;

  console.info("[generatePoster] success", {
    model: IMAGE_MODEL,
    recipe: recipe?.name ?? "none",
  });

  return {
    name: recipe?.name ?? "AI Design",
    nameAr: "تصميم بالذكاء الاصطناعي",
    imageBase64: base64DataUrl,
  };
}

// ── Generate a gift image via Gemini 2.5 Flash (visual-only) ────

export async function generateGiftImage(
  data: PostFormData
): Promise<GeneratedDesign> {
  const systemPrompt = getGiftImageSystemPrompt(data);
  const userMessage = getGiftImageUserMessage(data);

  const formImages = extractFormImages(data);

  console.info("[generateGiftImage] start", { model: GIFT_MODEL });

  // Build multimodal content — only product + logo, no inspiration images
  const contentParts: Array<
    | { type: "image"; image: Buffer; mediaType: string }
    | { type: "text"; text: string }
  > = [];

  const productPart = dataUrlToImagePart(formImages.product);
  if (productPart) {
    contentParts.push({
      type: "image" as const,
      image: productPart.image,
      mediaType: productPart.mediaType,
    });
  }

  const logoPart = dataUrlToImagePart(formImages.logo);
  if (logoPart) {
    contentParts.push({
      type: "image" as const,
      image: logoPart.image,
      mediaType: logoPart.mediaType,
    });
  }

  contentParts.push({ type: "text" as const, text: userMessage });

  let result;
  try {
    result = await generateText({
      model: gateway(GIFT_MODEL),
      system: systemPrompt,
      messages: [
        {
          role: "user" as const,
          content: contentParts,
        },
      ],
    });
  } catch (err) {
    console.error("[generateGiftImage] generateText threw", err);
    throw new Error(
      `Gift image generation failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const imageFile = result.files?.find((f) => f.mediaType?.startsWith("image/"));

  if (!imageFile) {
    console.error("[generateGiftImage] no image in response", {
      filesCount: result.files?.length ?? 0,
      textSnippet: result.text?.slice(0, 200),
    });
    throw new Error("Gift image model did not return an image");
  }

  const base64 = Buffer.from(imageFile.uint8Array).toString("base64");
  const base64DataUrl = `data:${imageFile.mediaType};base64,${base64}`;

  console.info("[generateGiftImage] success", { model: GIFT_MODEL });

  return {
    name: "Gift Design",
    nameAr: "هدية مجانية",
    imageBase64: base64DataUrl,
  };
}
