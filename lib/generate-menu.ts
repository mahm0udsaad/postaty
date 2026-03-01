"use server";

import { generateText } from "ai";
import { paidImageModel } from "@/lib/ai";
import { getMenuSystemPrompt, getMenuUserMessage } from "./menu-prompts";
import { selectMenuRecipes, formatMenuRecipeForPrompt } from "./menu-design-recipes";
import { getMenuInspirationImages } from "./menu-inspiration-images";
import { MENU_FORMAT_CONFIG } from "./constants";
import {
  buildImageProviderOptions,
  compressImageFromDataUrl,
  compressLogoFromDataUrl,
  getSharp,
} from "./image-helpers";
import type { MenuFormData } from "./types";
import type { BrandKitPromptData } from "./prompts";
import type { GeneratedDesign, GenerationUsage } from "./generate-designs";

// ── Model ID ──────────────────────────────────────────────────────

const PAID_MODEL_ID = "gemini-3-pro-image-preview";

// ── Generate a single menu/catalog image via Gemini Pro ───────────

export async function generateMenu(
  data: MenuFormData,
  brandKit?: BrandKitPromptData
): Promise<GeneratedDesign & { usage: GenerationUsage }> {
  const systemPrompt = getMenuSystemPrompt(data, brandKit);
  let userMessage = getMenuUserMessage(data);

  // Enrich with a menu design recipe for creative direction
  const [recipe] = selectMenuRecipes(data.menuCategory, 1, data.campaignType);
  if (recipe) {
    const recipeDirective = formatMenuRecipeForPrompt(recipe, data.campaignType);
    userMessage += `\n\n${recipeDirective}`;
  }

  userMessage += `\n\nMake this menu design professional, visually striking, and ensure ALL items are clearly visible with their prices.`;

  // Load menu inspiration images (3 references for layout guidance)
  const inspirationImages = await getMenuInspirationImages(
    data.menuCategory,
    3,
    data.campaignType
  );

  const formatConfig = MENU_FORMAT_CONFIG;

  console.info("[generateMenu] start", {
    model: PAID_MODEL_ID,
    recipe: recipe?.id ?? "none",
    inspirationCount: inspirationImages.length,
    itemCount: data.items.length,
    menuCategory: data.menuCategory,
  });

  // Build multimodal content parts
  const contentParts: Array<
    | { type: "image"; image: Buffer; mediaType: string }
    | { type: "text"; text: string }
  > = [];

  // 1. Add inspiration images
  for (const img of inspirationImages) {
    contentParts.push({
      type: "image" as const,
      image: img.image,
      mediaType: img.mediaType,
    });
  }

  // 2. Add item images (compressed to 600x600 to fit within token budget)
  for (const item of data.items) {
    const itemPart = await compressImageFromDataUrl(item.image, 600, 600, 70);
    if (itemPart) {
      contentParts.push({
        type: "image" as const,
        image: itemPart.image,
        mediaType: itemPart.mediaType,
      });
    }
  }

  // 3. Add logo image (compressed, PNG to preserve transparency)
  const logoPart = await compressLogoFromDataUrl(data.logo);
  if (logoPart) {
    contentParts.push({
      type: "image" as const,
      image: logoPart.image,
      mediaType: logoPart.mediaType,
    });
  }

  // 4. Build context text explaining each image
  let contextText = "";
  if (inspirationImages.length > 0) {
    contextText += `The first ${inspirationImages.length} image(s) are professional menu/flyer references — match their layout quality, grid structure, and composition style.\n`;
    if (data.campaignType === "standard") {
      contextText += `IMPORTANT: If the reference images contain seasonal or religious motifs, IGNORE those motifs. Use only their general design quality and layout structure.\n`;
    }
    contextText += `\n`;
  }

  contextText += `The next ${data.items.length} images are the product/item photos (in order):\n`;
  data.items.forEach((item, i) => {
    contextText += `  Image ${inspirationImages.length + i + 1}: "${item.name}" — Price: ${item.price}\n`;
  });
  contextText += `Display each product photo EXACTLY as provided. Do NOT redraw or stylize them.\n\n`;

  if (logoPart) {
    contextText += `The last image is the business logo — include it EXACTLY as given. Do NOT modify or redraw it.\n\n`;
  }

  contextText += userMessage;

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
    console.error("[generateMenu] generateText threw", err);
    const usage: GenerationUsage = {
      route: "menu",
      model: PAID_MODEL_ID,
      inputTokens: 0,
      outputTokens: 0,
      imagesGenerated: 0,
      durationMs,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
    throw Object.assign(
      new Error(`Menu generation failed: ${err instanceof Error ? err.message : String(err)}`),
      { usage }
    );
  }

  const durationMs = Date.now() - startTime;

  // Extract generated image from result.files
  const imageFile = result.files?.find((f) => f.mediaType?.startsWith("image/"));

  if (!imageFile) {
    console.error("[generateMenu] no image in response", {
      filesCount: result.files?.length ?? 0,
      textSnippet: result.text?.slice(0, 200),
    });
    const usage: GenerationUsage = {
      route: "menu",
      model: PAID_MODEL_ID,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      imagesGenerated: 0,
      durationMs,
      success: false,
      error: "Menu image model did not return an image",
    };
    throw Object.assign(new Error("Menu image model did not return an image"), { usage });
  }

  // Resize to A4 dimensions and output as JPEG to keep file size under 10MB
  const sharp = await getSharp();
  const resizedBuffer = await sharp(Buffer.from(imageFile.uint8Array))
    .resize(formatConfig.width, formatConfig.height, { fit: "fill" })
    .jpeg({ quality: 92 })
    .toBuffer();

  const base64 = resizedBuffer.toString("base64");
  const base64DataUrl = `data:image/jpeg;base64,${base64}`;

  const usage: GenerationUsage = {
    route: "menu",
    model: PAID_MODEL_ID,
    inputTokens: result.usage?.inputTokens ?? 0,
    outputTokens: result.usage?.outputTokens ?? 0,
    imagesGenerated: 1,
    durationMs,
    success: true,
  };

  console.info("[generateMenu] success", {
    model: PAID_MODEL_ID,
    recipe: recipe?.name ?? "none",
    durationMs,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  });

  return {
    name: recipe?.name ?? "Menu Design",
    nameAr: "تصميم قائمة بالذكاء الاصطناعي",
    imageBase64: base64DataUrl,
    usage,
  };
}
