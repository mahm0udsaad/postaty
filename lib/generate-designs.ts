"use server";

import { generateText } from "ai";
import { randomUUID } from "node:crypto";
import { primaryImageModel, paidImageModel, freeImageModel, marketingContentModel, google } from "@/lib/ai";
import {
  getImageDesignSystemPrompt,
  getImageDesignUserMessage,
  getGiftImageSystemPrompt,
  getGiftImageUserMessage,
  buildMarketingContentSystemPrompt,
  buildMarketingContentUserMessage,
} from "./poster-prompts";
import { formatRecipeForPrompt } from "./design-recipes";
import { selectRecipes } from "./design-recipes";
import { getInspirationImages } from "./inspiration-images";
import { FORMAT_CONFIGS } from "./constants";
import { buildImageProviderOptions, compressImageFromDataUrl, compressLogoFromDataUrl, getSharp } from "./image-helpers";
import { resolvePosterLanguage } from "./resolved-language";
import { prepareContext } from "./pre-translate";
import type { PostFormData, MarketingContentHub, SocialPlatform, PlatformContent } from "./types";
import type { BrandKitPromptData } from "./prompts";

// ── Types ──────────────────────────────────────────────────────────

export type GeneratedDesign = {
  name: string;
  nameAr: string;
  imageBase64: string;
};

export type GenerationUsage = {
  route: "poster" | "gift" | "reel" | "marketing-content" | "menu";
  model: string;
  inputTokens: number;
  outputTokens: number;
  imagesGenerated: number;
  durationMs: number;
  success: boolean;
  error?: string;
};

// ── Model IDs ───────────────────────────────────────────────────────

const PRIMARY_MODEL_ID = "gemini-3-pro-image-preview";
const FALLBACK_MODEL_ID = "gemini-3.1-flash-image-preview";
const FREE_MODEL_ID = "gemini-2.5-flash-image";

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
const GEN_PARALLEL_PREP_ENABLED = process.env.GEN_PARALLEL_PREP !== "0";
const VERBOSE_TIMING = process.env.NODE_ENV !== "production";

// ── Helpers ──────────────────────────────────────────────────────

function extractSubType(data: PostFormData): string | undefined {
  switch (data.category) {
    case "services": return data.serviceType;
    case "restaurant": return data.postType;
    case "supermarket": return data.postType;
    case "ecommerce": return data.postType;
    case "fashion": return data.postType;
    case "beauty": return data.postType;
  }
}

function extractFormImages(data: PostFormData): { product: string | undefined; logo: string } {
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
  const requestId = randomUUID();
  const resolvedLanguage = resolvePosterLanguage(data);

  // Enrich with a design recipe for creative direction
  const [recipe] = selectRecipes(data.category, 1, data.campaignType);

  // Load inspiration images, compress form images, and pre-translate — all in parallel
  const subType = extractSubType(data);
  const formImages = extractFormImages(data);
  const prepStart = Date.now();
  let inspirationLoadMs = 0;
  let productCompressionMs = 0;
  let logoCompressionMs = 0;

  const loadInspiration = async () => {
    const start = Date.now();
    const value = await getInspirationImages(data.category, undefined, data.campaignType, subType);
    inspirationLoadMs = Date.now() - start;
    return value;
  };

  const compressProduct = async () => {
    const start = Date.now();
    const value = formImages.product ? await compressImageFromDataUrl(formImages.product) : null;
    productCompressionMs = Date.now() - start;
    return value;
  };

  const compressLogo = async () => {
    const start = Date.now();
    const value = await compressLogoFromDataUrl(formImages.logo);
    logoCompressionMs = Date.now() - start;
    return value;
  };

  // Phase 1: Load and compress images in parallel
  const [inspirationImages, productPart, logoPart] = GEN_PARALLEL_PREP_ENABLED
    ? await Promise.all([loadInspiration(), compressProduct(), compressLogo()])
    : [await loadInspiration(), await compressProduct(), await compressLogo()];

  // Phase 2: Context prep — Gemini 2.5 Pro analyzes all images + translates text
  const { data: translatedData, wasTranslated, designBrief, translatedDropdowns } = await prepareContext(
    data,
    resolvedLanguage,
    inspirationImages,
    productPart,
    logoPart
  );

  // Phase 3: Build prompts using translated data + design brief
  const promptBuildStart = Date.now();
  const systemPrompt = getImageDesignSystemPrompt(translatedData, resolvedLanguage, brandKit, wasTranslated);
  let userMessage = getImageDesignUserMessage(translatedData, resolvedLanguage, wasTranslated, translatedDropdowns);

  if (recipe) {
    const recipeDirective = formatRecipeForPrompt(recipe, data.campaignType);
    userMessage += `\n\n${recipeDirective}`;
  }

  userMessage += `\n\nMake this design unique, bold, and visually striking.`;
  const promptBuildMs = Date.now() - promptBuildStart;

  const formatConfig = FORMAT_CONFIGS[data.format];
  const prepTotalMs = Date.now() - prepStart;

  console.info("[generatePoster] start", {
    requestId,
    model: PRIMARY_MODEL_ID,
    recipe: recipe?.id ?? "none",
    inspirationCount: inspirationImages.length,
    format: data.format,
    aspectRatio: formatConfig.aspectRatio,
    promptBuildMs,
    prepTotalMs,
    mode: GEN_PARALLEL_PREP_ENABLED ? "parallel" : "sequential",
    resolvedLanguage,
    preTranslated: wasTranslated,
  });

  if (VERBOSE_TIMING) {
    console.info("[generatePoster] prep_timing", {
      requestId,
      promptBuildMs,
      inspirationLoadMs,
      productCompressionMs,
      logoCompressionMs,
      prepTotalMs,
      mode: GEN_PARALLEL_PREP_ENABLED ? "parallel" : "sequential",
    });
  }

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
  if (productPart) {
    contentParts.push({
      type: "image" as const,
      image: productPart.image,
      mediaType: productPart.mediaType,
    });
  }

  // Add logo image (compressed, PNG to preserve transparency)
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
    contextText += `The first ${inspirationImages.length} image(s) are professional reference posters — use them for LAYOUT STRUCTURE and COMPOSITION IDEAS only (element placement, spacing, hierarchy, typography sizing).\n`;
    contextText += `CRITICAL: Do NOT copy the color scheme, background color, decorative style, or visual motifs from the reference images. Colors MUST come from the business logo provided — not from these references.\n`;
    if (data.campaignType === "standard") {
      contextText += `IMPORTANT: If the reference images contain seasonal or religious motifs (Ramadan, Eid, crescents, lanterns, Islamic arches), IGNORE those motifs entirely.\n`;
    }
    contextText += `\n`;
  }
  if (productPart) {
    contextText += `The ${inspirationImages.length > 0 ? "next" : "first"} image is the product/meal photo — place it EXACTLY as shown, unchanged. Do NOT redraw, stylize, or add elements to the product itself. Feature it prominently but preserve it exactly.\n`;
  }
  if (logoPart) {
    contextText += `The last image is the business logo — embed it as-is like pasting a sticker. Do NOT redraw, recreate, or re-render the logo. If the logo has text in it, that text is part of the image — do NOT re-type it. Place the logo EXACTLY ONCE.\n`;
    contextText += `CRITICAL COLOR RULE: Extract the dominant colors from this logo image and build the ENTIRE poster palette around them. The background, shapes, badges, and text colors must all match and complement the logo's actual colors. The poster must look like it belongs to the same brand as the logo.\n`;
  }
  // Inject AI-generated design brief from context prep
  if (designBrief) {
    contextText += `\n## Creative Director's Brief (from visual analysis of all images above)\n${designBrief}\n`;
  }

  contextText += wasTranslated
    ? `\nCRITICAL REMINDER: All text in the EXACT TEXT INVENTORY below has already been pre-translated to the target language. Render EVERY text string EXACTLY as written — character-for-character. Do NOT translate, transliterate, or modify any text. Do NOT invent any text, slogans, taglines, or promotional phrases. Do NOT add text to the product image. Show the product EXACTLY once. Show the logo EXACTLY once.\n`
    : `\nCRITICAL REMINDER: Render ONLY text from the EXACT TEXT INVENTORY below — nothing else. Translate inventory text to the target poster language if needed. Do NOT invent any text, slogans, taglines, or promotional phrases. Do NOT add text to the product image. Show the product EXACTLY once. Show the logo EXACTLY once.\n`;
  contextText += `\n${userMessage}`;

  contentParts.push({ type: "text" as const, text: contextText });

  const startTime = Date.now();
  let aiCallMs = 0;
  let result;
  let usedModelId = PRIMARY_MODEL_ID;

  const generateRequest = {
    providerOptions: buildImageProviderOptions(
      formatConfig.aspectRatio,
      Math.max(formatConfig.width, formatConfig.height) > 1080 ? "2K" : "1K"
    ),
    system: systemPrompt,
    messages: [{ role: "user" as const, content: contentParts }],
  };

  try {
    const aiStart = Date.now();
    // maxRetries: 0 — fail fast on primary so we reach the fallback quickly
    result = await generateText({ model: primaryImageModel, maxRetries: 0, ...generateRequest });
    aiCallMs = Date.now() - aiStart;
  } catch (primaryErr) {
    if (isCapacityError(primaryErr)) {
      console.warn("[generatePoster] primary model overloaded, falling back to", FALLBACK_MODEL_ID);
      try {
        usedModelId = FALLBACK_MODEL_ID;
        const aiStart = Date.now();
        result = await generateText({ model: paidImageModel, ...generateRequest });
        aiCallMs = Date.now() - aiStart;
      } catch (fallbackErr) {
        const durationMs = Date.now() - startTime;
        console.error("[generatePoster] fallback model also failed", fallbackErr);
        const usage: GenerationUsage = {
          route: "poster",
          model: FALLBACK_MODEL_ID,
          inputTokens: 0,
          outputTokens: 0,
          imagesGenerated: 0,
          durationMs,
          success: false,
          error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
        };
        throw Object.assign(
          new Error(`Image generation failed: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`),
          { usage }
        );
      }
    } else {
      const durationMs = Date.now() - startTime;
      console.error("[generatePoster] generateText threw", primaryErr);
      const usage: GenerationUsage = {
        route: "poster",
        model: PRIMARY_MODEL_ID,
        inputTokens: 0,
        outputTokens: 0,
        imagesGenerated: 0,
        durationMs,
        success: false,
        error: primaryErr instanceof Error ? primaryErr.message : String(primaryErr),
      };
      throw Object.assign(
        new Error(`Image generation failed: ${primaryErr instanceof Error ? primaryErr.message : String(primaryErr)}`),
        { usage }
      );
    }
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
      model: usedModelId,
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
  const resizeStart = Date.now();
  const sharp = await getSharp();
  const resizedBuffer = await sharp(Buffer.from(imageFile.uint8Array))
    .resize(formatConfig.width, formatConfig.height, { fit: "fill" })
    .jpeg({ quality: 90 })
    .toBuffer();
  const postprocessResizeMs = Date.now() - resizeStart;

  const base64 = resizedBuffer.toString("base64");
  const base64DataUrl = `data:image/jpeg;base64,${base64}`;

  const usage: GenerationUsage = {
    route: "poster",
    model: usedModelId,
    inputTokens: result.usage?.inputTokens ?? 0,
    outputTokens: result.usage?.outputTokens ?? 0,
    imagesGenerated: 1,
    durationMs,
    success: true,
  };

  console.info("[generatePoster] success", {
    requestId,
    model: usedModelId,
    recipe: recipe?.name ?? "none",
    durationMs,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    aiCallMs,
    postprocessResizeMs,
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

  const giftProductPart = formImages.product ? await compressImageFromDataUrl(formImages.product) : null;
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
  const sharpGift = await getSharp();
  const resizedGiftBuffer = await sharpGift(Buffer.from(imageFile.uint8Array))
    .resize(formatConfig.width, formatConfig.height, { fit: "fill" })
    .jpeg({ quality: 90 })
    .toBuffer();

  const base64 = resizedGiftBuffer.toString("base64");
  const base64DataUrl = `data:image/jpeg;base64,${base64}`;

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

// ── Generate Marketing Content via Gemini 3 Flash (with web search) ──

const MARKETING_MODEL_ID = "gemini-3-flash-preview";

const MARKETING_JSON_INSTRUCTION = `

IMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no explanation). The JSON must have this exact structure:
{
  "facebook": { "caption": "...", "hashtags": ["...", "..."], "bestPostingTime": "...", "bestPostingTimeReason": "...", "contentTip": "..." },
  "instagram": { "caption": "...", "hashtags": ["...", "..."], "bestPostingTime": "...", "bestPostingTimeReason": "...", "contentTip": "..." },
  "whatsapp": { "caption": "...", "hashtags": ["...", "..."], "bestPostingTime": "...", "bestPostingTimeReason": "...", "contentTip": "..." },
  "tiktok": { "caption": "...", "hashtags": ["...", "..."], "bestPostingTime": "...", "bestPostingTimeReason": "...", "contentTip": "..." }
}`;

function parseMarketingContentJson(text: string): Record<string, { caption: string; hashtags: string[]; bestPostingTime: string; bestPostingTimeReason: string; contentTip: string }> {
  // Strip markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const parsed = JSON.parse(cleaned);

  // Validate required platforms
  for (const platform of ["facebook", "instagram", "whatsapp", "tiktok"]) {
    if (!parsed[platform]) {
      throw new Error(`Missing platform: ${platform}`);
    }
    const p = parsed[platform];
    if (typeof p.caption !== "string" || !Array.isArray(p.hashtags) || typeof p.bestPostingTime !== "string") {
      throw new Error(`Invalid structure for platform: ${platform}`);
    }
  }

  return parsed;
}

export async function generateMarketingContent(
  data: PostFormData,
  language: string = "auto"
): Promise<MarketingContentHub & { usage: GenerationUsage }> {
  const systemPrompt = buildMarketingContentSystemPrompt(data, language) + MARKETING_JSON_INSTRUCTION;
  const userMessage = buildMarketingContentUserMessage(data, language);

  console.info("[generateMarketingContent] start", {
    model: MARKETING_MODEL_ID,
    language,
    category: data.category,
  });

  const startTime = Date.now();
  try {
    const result = await generateText({
      model: marketingContentModel,
      tools: {
        google_search: google.tools.googleSearch({}),
      },
      system: systemPrompt,
      prompt: userMessage,
    });

    const durationMs = Date.now() - startTime;

    const parsed = parseMarketingContentJson(result.text);

    const PLATFORM_KEYS: SocialPlatform[] = ["facebook", "instagram", "whatsapp", "tiktok"];
    const contents = {} as Record<SocialPlatform, PlatformContent>;
    for (const platform of PLATFORM_KEYS) {
      contents[platform] = {
        platform,
        caption: parsed[platform].caption,
        hashtags: parsed[platform].hashtags,
        bestPostingTime: parsed[platform].bestPostingTime,
        bestPostingTimeReason: parsed[platform].bestPostingTimeReason || "",
        contentTip: parsed[platform].contentTip || "",
      };
    }

    const usage: GenerationUsage = {
      route: "marketing-content",
      model: MARKETING_MODEL_ID,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      imagesGenerated: 0,
      durationMs,
      success: true,
    };

    console.info("[generateMarketingContent] success", {
      model: MARKETING_MODEL_ID,
      durationMs,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    });

    return {
      contents,
      language,
      generatedAt: Date.now(),
      usage,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error("[generateMarketingContent] failed", err);
    const usage: GenerationUsage = {
      route: "marketing-content",
      model: MARKETING_MODEL_ID,
      inputTokens: 0,
      outputTokens: 0,
      imagesGenerated: 0,
      durationMs,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
    throw Object.assign(
      new Error(`Marketing content generation failed: ${err instanceof Error ? err.message : String(err)}`),
      { usage }
    );
  }
}

// ── Menu Marketing Content ──────────────────────────────────────────

export async function generateMenuMarketingContent(
  data: import("./types").MenuFormData,
  language: string = "auto"
): Promise<MarketingContentHub & { usage: GenerationUsage }> {
  const langInstruction = language === "auto"
    ? "CRITICAL: Detect the language of the user's input (business name, item names, etc.) and generate ALL output text in that SAME language."
    : language === "ar"
    ? "CRITICAL: ALL output text MUST be in Arabic. Hashtags can mix Arabic and English."
    : "CRITICAL: ALL output text MUST be in English. Hashtags should be in English.";

  const categoryLabel = data.menuCategory === "restaurant" ? "Restaurant / Cafe" : "Supermarket";
  const itemSummary = data.items
    .map((item) => item.oldPrice ? `${item.name} (${item.price}, was ${item.oldPrice})` : `${item.name} (${item.price})`)
    .join(", ");

  const systemPrompt = `You are an expert social media marketing strategist specializing in MENA region businesses.

${langInstruction}

Your task: Generate optimized marketing content for 4 social media platforms (Facebook, Instagram, WhatsApp, TikTok) to promote a menu/catalog post.

Use Google Search to find:
1. Current best posting times for each platform in the MENA/Arab region (${new Date().getFullYear()})
2. Trending hashtags for food/grocery businesses in the region
3. Current engagement best practices per platform

REQUIREMENTS PER PLATFORM:

**Facebook:** 1-3 paragraphs, storytelling, clear CTA, 3-5 hashtags, best posting time (MENA).
**Instagram:** Hook first line, emoji-rich, 15-25 hashtags, best posting time (MENA).
**WhatsApp:** Short, direct, conversational, 0-3 hashtags, best broadcast time.
**TikTok:** Very short, trendy hook, 5-10 hashtags, best posting time.

For bestPostingTime: specific days and time ranges.
For bestPostingTimeReason: explain WHY (1 sentence).
For contentTip: ONE actionable tip for this platform and business type.` + MARKETING_JSON_INSTRUCTION;

  const userMessage = `Generate optimized marketing captions for all 4 platforms for this menu/catalog post:

Business: ${data.businessName}
Type: ${categoryLabel}
Menu items: ${itemSummary}
WhatsApp: ${data.whatsapp}${data.address ? `\nAddress: ${data.address}` : ""}

Make the content compelling, platform-native, and optimized for engagement in the MENA/Arab region.`;

  console.info("[generateMenuMarketingContent] start", { model: MARKETING_MODEL_ID, language });

  const startTime = Date.now();
  try {
    const result = await generateText({
      model: marketingContentModel,
      tools: { google_search: google.tools.googleSearch({}) },
      system: systemPrompt,
      prompt: userMessage,
    });

    const durationMs = Date.now() - startTime;
    const parsed = parseMarketingContentJson(result.text);

    const PLATFORM_KEYS: SocialPlatform[] = ["facebook", "instagram", "whatsapp", "tiktok"];
    const contents = {} as Record<SocialPlatform, PlatformContent>;
    for (const platform of PLATFORM_KEYS) {
      contents[platform] = {
        platform,
        caption: parsed[platform].caption,
        hashtags: parsed[platform].hashtags,
        bestPostingTime: parsed[platform].bestPostingTime,
        bestPostingTimeReason: parsed[platform].bestPostingTimeReason || "",
        contentTip: parsed[platform].contentTip || "",
      };
    }

    const usage: GenerationUsage = {
      route: "marketing-content",
      model: MARKETING_MODEL_ID,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      imagesGenerated: 0,
      durationMs,
      success: true,
    };

    return { contents, language, generatedAt: Date.now(), usage };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error("[generateMenuMarketingContent] failed", err);
    const usage: GenerationUsage = {
      route: "marketing-content",
      model: MARKETING_MODEL_ID,
      inputTokens: 0,
      outputTokens: 0,
      imagesGenerated: 0,
      durationMs,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
    throw Object.assign(
      new Error(`Menu marketing content generation failed: ${err instanceof Error ? err.message : String(err)}`),
      { usage }
    );
  }
}
