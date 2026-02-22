"use server";

import { generateText } from "ai";
import { paidImageModel, freeImageModel } from "@/lib/ai";
import {
  getImageDesignSystemPrompt,
  getImageDesignUserMessage,
  getGiftImageSystemPrompt,
  getGiftImageUserMessage,
} from "./poster-prompts";
import { formatRecipeForPrompt } from "./design-recipes";
import { selectRecipes } from "./design-recipes";
import { getInspirationImages } from "./inspiration-images";
import { FORMAT_CONFIGS } from "./constants";
import type { PostFormData } from "./types";
import type { BrandKitPromptData } from "./prompts";

// ── Types ──────────────────────────────────────────────────────────

export type GeneratedDesign = {
  name: string;
  nameAr: string;
  imageBase64: string;
};

export type GenerationUsage = {
  route: "poster" | "gift";
  model: string;
  inputTokens: number;
  outputTokens: number;
  imagesGenerated: number;
  durationMs: number;
  success: boolean;
  error?: string;
};

// ── Model IDs (for usage tracking) ─────────────────────────────────

const PAID_MODEL_ID = "gemini-3-pro-image-preview";
const FREE_MODEL_ID = "gemini-2.5-flash-image";

// ── Google provider options for image responses ────────────────────

function buildImageProviderOptions(aspectRatio: string, imageSize?: "1K" | "2K" | "4K") {
  return {
    google: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio,
        ...(imageSize ? { imageSize } : {}),
      },
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────

async function compressImageFromDataUrl(
  dataUrl: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 75
): Promise<{ image: Buffer; mediaType: "image/jpeg" } | null> {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  const raw = Buffer.from(match[2], "base64");
  const sharp = (await import("sharp")).default;
  const compressed = await sharp(raw)
    .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();
  return { image: compressed, mediaType: "image/jpeg" };
}

async function compressLogoFromDataUrl(
  dataUrl: string,
  maxWidth = 400,
  maxHeight = 400
): Promise<{ image: Buffer; mediaType: "image/png" } | null> {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  const raw = Buffer.from(match[2], "base64");
  const sharp = (await import("sharp")).default;
  const compressed = await sharp(raw)
    .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
    .png({ quality: 80 })
    .toBuffer();
  return { image: compressed, mediaType: "image/png" };
}

function extractFormImages(data: PostFormData): { product: string; logo: string } {
  switch (data.category) {
    case "restaurant":
      return { product: data.mealImage, logo: data.logo };
    case "supermarket":
      return { product: data.productImages[0], logo: data.logo };
    case "ecommerce":
      return { product: data.productImage, logo: data.logo };
    case "services":
      return { product: data.serviceImage, logo: data.logo };
    case "fashion":
      return { product: data.productImage, logo: data.logo };
    case "beauty":
      return { product: data.serviceImage, logo: data.logo };
  }
}

// ── Generate a single poster via Gemini Pro (paid) ─────────────────

export async function generatePoster(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): Promise<GeneratedDesign & { usage: GenerationUsage }> {
  const systemPrompt = getImageDesignSystemPrompt(data, brandKit);
  let userMessage = getImageDesignUserMessage(data);

  // Enrich with a design recipe for creative direction
  const [recipe] = selectRecipes(data.category, 1, data.campaignType);
  if (recipe) {
    const recipeDirective = formatRecipeForPrompt(recipe, data.campaignType);
    userMessage += `\n\n${recipeDirective}`;
  }

  userMessage += `\n\nMake this design unique, bold, and visually striking.`;

  // Load inspiration images and extract form images
  const inspirationImages = await getInspirationImages(data.category, undefined, data.campaignType);
  const formImages = extractFormImages(data);

  const formatConfig = FORMAT_CONFIGS[data.format];

  console.info("[generatePoster] start", {
    model: PAID_MODEL_ID,
    recipe: recipe?.id ?? "none",
    inspirationCount: inspirationImages.length,
    format: data.format,
    aspectRatio: formatConfig.aspectRatio,
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

  // Add product image (compressed)
  const productPart = await compressImageFromDataUrl(formImages.product);
  if (productPart) {
    contentParts.push({
      type: "image" as const,
      image: productPart.image,
      mediaType: productPart.mediaType,
    });
  }

  // Add logo image (compressed, PNG to preserve transparency)
  const logoPart = await compressLogoFromDataUrl(formImages.logo);
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
    contextText += `The first ${inspirationImages.length} image(s) are professional reference posters — match their layout quality and composition style.\n`;
    if (data.campaignType === "standard") {
      contextText += `IMPORTANT: If the reference images contain seasonal or religious motifs (Ramadan, Eid, crescents, lanterns, Islamic arches), IGNORE those motifs entirely. Use only their general design quality, layout structure, and color energy as inspiration.\n`;
    }
    contextText += `\n`;
  }
  if (productPart) {
    contextText += `The ${inspirationImages.length > 0 ? "next" : "first"} image is the product/meal photo — place it EXACTLY as shown, unchanged. Do NOT redraw, stylize, or add elements to the product itself. Feature it prominently but preserve it exactly.\n`;
  }
  if (logoPart) {
    contextText += `The last image is the business logo — include it EXACTLY as given. Do NOT modify, redraw, or add text to the logo.\n`;
  }
  contextText += `\n${userMessage}`;

  contentParts.push({ type: "text" as const, text: contextText });

  const startTime = Date.now();
  let result;
  try {
    result = await generateText({
      model: paidImageModel,
      providerOptions: buildImageProviderOptions(formatConfig.aspectRatio, "2K"),
      system: systemPrompt,
      messages: [
        {
          role: "user" as const,
          content: contentParts,
        },
      ],
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error("[generatePoster] generateText threw", err);
    const usage: GenerationUsage = {
      route: "poster",
      model: PAID_MODEL_ID,
      inputTokens: 0,
      outputTokens: 0,
      imagesGenerated: 0,
      durationMs,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
    throw Object.assign(
      new Error(`Image generation failed: ${err instanceof Error ? err.message : String(err)}`),
      { usage }
    );
  }

  const durationMs = Date.now() - startTime;

  // Extract generated image from result.files (AI SDK v6)
  const imageFile = result.files?.find((f) => f.mediaType?.startsWith("image/"));

  if (!imageFile) {
    console.error("[generatePoster] no image in response", {
      filesCount: result.files?.length ?? 0,
      textSnippet: result.text?.slice(0, 200),
    });
    const usage: GenerationUsage = {
      route: "poster",
      model: PAID_MODEL_ID,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      imagesGenerated: 0,
      durationMs,
      success: false,
      error: "Image model did not return an image",
    };
    throw Object.assign(new Error("Image model did not return an image"), { usage });
  }

  // Resize to exact target dimensions for the selected format
  const sharp = (await import("sharp")).default;
  const resizedBuffer = await sharp(Buffer.from(imageFile.uint8Array))
    .resize(formatConfig.width, formatConfig.height, { fit: "fill" })
    .png()
    .toBuffer();

  const base64 = resizedBuffer.toString("base64");
  const base64DataUrl = `data:image/png;base64,${base64}`;

  const usage: GenerationUsage = {
    route: "poster",
    model: PAID_MODEL_ID,
    inputTokens: result.usage?.inputTokens ?? 0,
    outputTokens: result.usage?.outputTokens ?? 0,
    imagesGenerated: 1,
    durationMs,
    success: true,
  };

  console.info("[generatePoster] success", {
    model: PAID_MODEL_ID,
    recipe: recipe?.name ?? "none",
    durationMs,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  });

  return {
    name: recipe?.name ?? "AI Design",
    nameAr: "تصميم بالذكاء الاصطناعي",
    imageBase64: base64DataUrl,
    usage,
  };
}

// ── Generate a gift image via Gemini 2.5 Flash (free) ──────────────

export async function generateGiftImage(
  data: PostFormData
): Promise<GeneratedDesign & { usage: GenerationUsage }> {
  const systemPrompt = getGiftImageSystemPrompt(data);
  const userMessage = getGiftImageUserMessage(data);

  const formImages = extractFormImages(data);
  const formatConfig = FORMAT_CONFIGS[data.format];

  console.info("[generateGiftImage] start", { model: FREE_MODEL_ID, format: data.format });

  // Build multimodal content — only product + logo, no inspiration images
  const contentParts: Array<
    | { type: "image"; image: Buffer; mediaType: string }
    | { type: "text"; text: string }
  > = [];

  const giftProductPart = await compressImageFromDataUrl(formImages.product);
  if (giftProductPart) {
    contentParts.push({
      type: "image" as const,
      image: giftProductPart.image,
      mediaType: giftProductPart.mediaType,
    });
  }

  const giftLogoPart = await compressLogoFromDataUrl(formImages.logo);
  if (giftLogoPart) {
    contentParts.push({
      type: "image" as const,
      image: giftLogoPart.image,
      mediaType: giftLogoPart.mediaType,
    });
  }

  contentParts.push({ type: "text" as const, text: userMessage });

  const startTime = Date.now();
  let result;
  try {
    result = await generateText({
      model: freeImageModel,
      providerOptions: buildImageProviderOptions(formatConfig.aspectRatio),
      system: systemPrompt,
      messages: [
        {
          role: "user" as const,
          content: contentParts,
        },
      ],
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error("[generateGiftImage] generateText threw", err);
    const usage: GenerationUsage = {
      route: "gift",
      model: FREE_MODEL_ID,
      inputTokens: 0,
      outputTokens: 0,
      imagesGenerated: 0,
      durationMs,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
    throw Object.assign(
      new Error(`Gift image generation failed: ${err instanceof Error ? err.message : String(err)}`),
      { usage }
    );
  }

  const durationMs = Date.now() - startTime;

  const imageFile = result.files?.find((f) => f.mediaType?.startsWith("image/"));

  if (!imageFile) {
    console.error("[generateGiftImage] no image in response", {
      filesCount: result.files?.length ?? 0,
      textSnippet: result.text?.slice(0, 200),
    });
    const usage: GenerationUsage = {
      route: "gift",
      model: FREE_MODEL_ID,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      imagesGenerated: 0,
      durationMs,
      success: false,
      error: "Gift image model did not return an image",
    };
    throw Object.assign(new Error("Gift image model did not return an image"), { usage });
  }

  // Resize to exact target dimensions for the selected format
  const sharpGift = (await import("sharp")).default;
  const resizedGiftBuffer = await sharpGift(Buffer.from(imageFile.uint8Array))
    .resize(formatConfig.width, formatConfig.height, { fit: "fill" })
    .png()
    .toBuffer();

  const base64 = resizedGiftBuffer.toString("base64");
  const base64DataUrl = `data:image/png;base64,${base64}`;

  const usage: GenerationUsage = {
    route: "gift",
    model: FREE_MODEL_ID,
    inputTokens: result.usage?.inputTokens ?? 0,
    outputTokens: result.usage?.outputTokens ?? 0,
    imagesGenerated: 1,
    durationMs,
    success: true,
  };

  console.info("[generateGiftImage] success", {
    model: FREE_MODEL_ID,
    durationMs,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  });

  return {
    name: "Gift Design",
    nameAr: "هدية مجانية",
    imageBase64: base64DataUrl,
    usage,
  };
}
