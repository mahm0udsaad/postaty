"use server";

import { generateText } from "ai";
import { google, paidImageModel } from "@/lib/ai";
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

// ── Model IDs ─────────────────────────────────────────────────────

const PRIMARY_MODEL_ID = "gemini-3-pro-image-preview";
const FALLBACK_MODEL_ID = "gemini-3.1-flash-image-preview";
const menuImageModel = google(PRIMARY_MODEL_ID);

/** Check if an error is a capacity/overload issue worth retrying with a fallback model */
function isCapacityError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("capacity") ||
    msg.includes("rate limit") ||
    msg.includes("resource exhausted") ||
    msg.includes("503") ||
    msg.includes("429")
  );
}

// ── Generate a single menu/catalog image via Gemini Pro ───────────

export async function generateMenu(
  data: MenuFormData,
  brandKit?: BrandKitPromptData
): Promise<GeneratedDesign & { usage: GenerationUsage }> {
  // Enrich with a menu design recipe for creative direction
  const [recipe] = selectMenuRecipes(data.menuCategory, 1, data.campaignType);

  // Phase 1: Load inspiration images, compress item images + logo — ALL in parallel
  const [inspirationImages, itemImages, logoPart] = await Promise.all([
    getMenuInspirationImages(data.menuCategory, 3, data.campaignType),
    Promise.all(
      data.items.map((item) => compressImageFromDataUrl(item.image, 600, 600, 70))
    ),
    compressLogoFromDataUrl(data.logo),
  ]);

  // Phase 2: Skip the extra Gemini 2.5 Pro call — the main model sees all images directly.
  // Menu always uses "auto" language (no translation needed), and the design brief
  // added ~15-30s latency for minimal value since only 1 item image was analyzed.
  const translatedData = data;
  const wasTranslated = false;

  // Phase 3: Build prompts using translated data
  const systemPrompt = getMenuSystemPrompt(translatedData, brandKit);
  let userMessage = getMenuUserMessage(translatedData);

  if (recipe) {
    const recipeDirective = formatMenuRecipeForPrompt(recipe, data.campaignType);
    userMessage += `\n\n${recipeDirective}`;
  }

  userMessage += `\n\nMake this menu design professional, visually striking, and ensure ALL items are clearly visible with their prices.`;

  const formatConfig = MENU_FORMAT_CONFIG;

  console.info("[generateMenu] start", {
    model: PRIMARY_MODEL_ID,
    recipe: recipe?.id ?? "none",
    inspirationCount: inspirationImages.length,
    itemCount: data.items.length,
    menuCategory: data.menuCategory,
    preTranslated: wasTranslated,
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

  // 2. Add item images (already compressed)
  for (const itemPart of itemImages) {
    if (itemPart) {
      contentParts.push({
        type: "image" as const,
        image: itemPart.image,
        mediaType: itemPart.mediaType,
      });
    }
  }

  // 3. Add logo image
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
    contextText += `The first ${inspirationImages.length} image(s) are professional menu/flyer references — match their visual quality, color palette, and composition style ONLY.\n`;
    contextText += `CRITICAL: Do NOT match the reference images' grid size or item count. The references may show 6-9 items but YOU must show EXACTLY ${translatedData.items.length} items. Ignore how many products appear in the references.\n`;
    if (data.campaignType === "standard") {
      contextText += `IMPORTANT: If the reference images contain seasonal or religious motifs, IGNORE those motifs. Use only their general design quality.\n`;
    }
    contextText += `CRITICAL: References are STYLE ONLY. Do NOT copy their products, item count, grid layout, text, prices, or logo. Build content ONLY from the uploaded item photos and provided item list.\n`;
    contextText += `\n`;
  }

  contextText += `The next ${translatedData.items.length} images are the product/item photos (in order):\n`;
  translatedData.items.forEach((item, i) => {
    contextText += `  Image ${inspirationImages.length + i + 1}: "${item.name}" — Price: ${item.price}\n`;
  });
  contextText += `Display each product photo EXACTLY as provided. Do NOT redraw or stylize them.\n`;
  contextText += `You MUST render EXACTLY ${translatedData.items.length} menu items (no more, no less), and each listed item must appear exactly once.\n\n`;

  if (logoPart) {
    contextText += `The last image is the business logo. You MUST place this exact logo image as-is in the design, exactly once. Do NOT redraw, recreate, restyle, recolor, crop, retype, or modify any part of the logo.\n\n`;
  }

  contextText += wasTranslated
    ? `CRITICAL: All text below has been pre-translated to the target language. Render EVERY text string EXACTLY as written — character-for-character. You are a LAYOUT ENGINE — paste the given text, do NOT create, modify, or translate any text yourself.\n\n`
    : ``;

  contextText += userMessage;

  // Final reinforcement — the last thing the model reads is most influential
  const itemNamesList = translatedData.items.map((item, i) => `${i + 1}. "${item.name}"`).join(", ");
  contextText += `\n\n## FINAL VERIFICATION (read this last)\nThe menu MUST contain EXACTLY ${translatedData.items.length} product cells: ${itemNamesList}. That is the COMPLETE list. Any product not in this list is FORBIDDEN — do NOT invent, duplicate, or add extra items under any circumstances.`;

  contentParts.push({ type: "text" as const, text: contextText });

  const startTime = Date.now();
  let result;
  let usedModelId = PRIMARY_MODEL_ID;

  const generateRequest = {
    providerOptions: buildImageProviderOptions(formatConfig.aspectRatio, "2K"),
    system: systemPrompt,
    messages: [
      {
        role: "user" as const,
        content: contentParts,
      },
    ],
  };

  try {
    // maxRetries: 0 = single attempt, no retries. Fail fast so we reach fallback quickly.
    result = await generateText({ model: menuImageModel, maxRetries: 0, ...generateRequest });
  } catch (primaryErr) {
    if (isCapacityError(primaryErr)) {
      console.warn("[generateMenu] primary model overloaded, falling back to", FALLBACK_MODEL_ID);
      try {
        usedModelId = FALLBACK_MODEL_ID;
        // Fallback gets default retries (2 retries = 3 total attempts)
        result = await generateText({ model: paidImageModel, ...generateRequest });
      } catch (fallbackErr) {
        const durationMs = Date.now() - startTime;
        console.error("[generateMenu] fallback model also failed", fallbackErr);
        const usage: GenerationUsage = {
          route: "menu",
          model: FALLBACK_MODEL_ID,
          inputTokens: 0,
          outputTokens: 0,
          imagesGenerated: 0,
          durationMs,
          success: false,
          error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
        };
        throw Object.assign(
          new Error(`Menu generation failed: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`),
          { usage }
        );
      }
    } else {
      const durationMs = Date.now() - startTime;
      console.error("[generateMenu] generateText threw", primaryErr);
      const usage: GenerationUsage = {
        route: "menu",
        model: PRIMARY_MODEL_ID,
        inputTokens: 0,
        outputTokens: 0,
        imagesGenerated: 0,
        durationMs,
        success: false,
        error: primaryErr instanceof Error ? primaryErr.message : String(primaryErr),
      };
      throw Object.assign(
        new Error(`Menu generation failed: ${primaryErr instanceof Error ? primaryErr.message : String(primaryErr)}`),
        { usage }
      );
    }
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
      model: usedModelId,
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
    model: usedModelId,
    inputTokens: result.usage?.inputTokens ?? 0,
    outputTokens: result.usage?.outputTokens ?? 0,
    imagesGenerated: 1,
    durationMs,
    success: true,
  };

  console.info("[generateMenu] success", {
    model: usedModelId,
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
