"use server";

import { generateText } from "ai";
import { translationModel, google } from "@/lib/ai";
import { detectInputLanguage } from "@/lib/resolved-language";
import type { PostFormData, MenuFormData } from "@/lib/types";
import type { ResolvedLanguage } from "@/lib/resolved-language";

// ── Translatable field definitions per category ─────────────────
// Includes ALL text that appears on the poster: free text, prices, AND dropdown values (CTA, badges, delivery).

/** Shared dropdown fields present in ALL categories */
const SHARED_DROPDOWN_FIELDS = ["cta"];

const CATEGORY_FIELDS: Record<string, string[]> = {
  restaurant: ["mealName", "description", "newPrice", "oldPrice", "offerDuration"],
  supermarket: ["productName", "newPrice", "oldPrice", "offerDuration"],
  ecommerce: ["productName", "features", "newPrice", "oldPrice", "shippingDuration"],
  services: [
    "serviceName",
    "serviceDetails",
    "price",
    "coverageArea",
    "executionTime",
    "warranty",
    "quickFeatures",
    "offerDuration",
  ],
  fashion: [
    "itemName",
    "description",
    "newPrice",
    "oldPrice",
    "availableSizes",
    "availableColors",
    "offerNote",
    "offerDuration",
  ],
  beauty: ["serviceName", "benefit", "newPrice", "oldPrice", "sessionDuration", "suitableFor", "offerDuration"],
};

const LANG_NAMES: Record<string, string> = {
  ar: "Arabic",
  en: "English",
  fr: "French",
  de: "German",
  tr: "Turkish",
  he: "Hebrew",
};

// ── Types ───────────────────────────────────────────────────────

export type ContextPrepResult = {
  data: PostFormData;
  wasTranslated: boolean;
  designBrief: string | null;
  /** AI-translated dropdown values — use instead of static tables when present */
  translatedDropdowns: {
    offerBadgeText?: string;
    deliveryText?: string;
  } | null;
};

type CompressedImage = { image: Buffer; mediaType: string } | null;

// ── Helpers ─────────────────────────────────────────────────────

/** Badge/delivery enum-to-text mappings (Arabic source values) */
const BADGE_TEXT: Record<string, string> = {
  discount: "خصم",
  new: "جديد",
  bestseller: "الأكثر مبيعاً",
};

const DELIVERY_TEXT: Record<string, string> = {
  free: "توصيل مجاني",
  paid: "توصيل مدفوع",
};

function extractTranslatableFields(data: PostFormData): Record<string, string> {
  const fieldNames = [
    ...(CATEGORY_FIELDS[data.category] ?? []),
    ...SHARED_DROPDOWN_FIELDS,
  ];
  const result: Record<string, string> = {};
  for (const field of fieldNames) {
    const value = (data as unknown as Record<string, unknown>)[field];
    if (typeof value === "string" && value.trim()) {
      result[field] = value;
    }
  }

  // Resolve enum dropdowns to their Arabic text so the AI can translate them
  const dataAny = data as unknown as Record<string, unknown>;
  if (typeof dataAny.offerBadge === "string" && BADGE_TEXT[dataAny.offerBadge]) {
    result["_offerBadgeText"] = BADGE_TEXT[dataAny.offerBadge];
  }
  if (typeof dataAny.deliveryType === "string" && DELIVERY_TEXT[dataAny.deliveryType]) {
    result["_deliveryText"] = DELIVERY_TEXT[dataAny.deliveryType];
  }

  return result;
}

function applyTranslations(
  data: PostFormData,
  translations: Record<string, string>
): PostFormData {
  const clone = { ...data } as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(translations)) {
    clone[key] = value;
  }
  return clone as unknown as PostFormData;
}

/** Extract JSON from a model response that may contain markdown or thinking text */
function extractJson(text: string): Record<string, unknown> {
  let cleaned = text.trim();

  // Try to find JSON block in markdown code fence
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Try to find JSON object in the text (first { to last })
  if (!cleaned.startsWith("{")) {
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    }
  }

  return JSON.parse(cleaned);
}

// ── Step 1: Translation (text-only, fast) ───────────────────────

async function translateFields(
  fields: Record<string, string>,
  fromLang: string,
  toLang: string
): Promise<Record<string, string>> {
  const entries = Object.entries(fields);
  if (entries.length === 0) return {};

  const fromName = LANG_NAMES[fromLang] ?? fromLang;
  const toName = LANG_NAMES[toLang] ?? toLang;

  const fieldList = entries.map(([key, val], i) => `${i + 1}. [${key}]: "${val}"`).join("\n");

  const prompt = `You are a professional translator for marketing posters. Translate the following text from ${fromName} to ${toName}.

## CRITICAL ACCURACY RULES

1. USE REAL NATIVE ${toName.toUpperCase()} WORDS — absolutely NO transliteration (rewriting words in a different script).
   - WRONG: Arabic "بطاطس" → Hebrew "בטאטס" (this is just Arabic in Hebrew letters!)
   - CORRECT: Arabic "بطاطس" → Hebrew "צ'יפס" (actual Hebrew word for fries)
   - WRONG: Arabic "توصيل مجاني" → Hebrew "תוצ'יל מג'אני"
   - CORRECT: Arabic "توصيل مجاני" → Hebrew "משלוח חינם"
   - WRONG: Arabic "درهم" → Hebrew "דרהם"
   - CORRECT: Arabic "درهم" → Hebrew "דירהם"

2. For PRICE fields (newPrice, oldPrice, price): translate the currency name but keep the number exactly the same.
   - Arabic "20 درهم" → Hebrew "20 דירהם"
   - Arabic "130 جنيه" → Hebrew "130 לירות מצריות"
   - Convert Arabic numerals ٠١٢٣٤٥٦٧٨٩ to Western 0123456789

3. For FOOD/PRODUCT names: use the common ${toName} name that local customers would recognize.
   - Use Google Search to verify the correct ${toName} term if unsure.

4. Keep translations CONCISE — they must fit on a marketing poster.

5. If a value is already in ${toName}, return it UNCHANGED.

6. Do NOT add or remove information — translate the meaning exactly.

## USE GOOGLE SEARCH
Search for the correct ${toName} translation of any word you are not 100% certain about. Accuracy is more important than speed.

## Fields to translate:
${fieldList}

## Response format
Respond with ONLY a valid JSON object mapping field names to translated values. No markdown, no code blocks, no explanation.
Example: {"fieldName1": "translated value", "fieldName2": "translated value"}`;

  const result = await generateText({
    model: translationModel,
    tools: { google_search: google.tools.googleSearch({}) },
    prompt,
  });

  const parsed = extractJson(result.text);

  // Per-field fallback
  const translated: Record<string, string> = {};
  for (const [key, val] of entries) {
    const t = parsed[key];
    translated[key] = typeof t === "string" && t.trim() ? t : val;
  }

  console.info("[translateFields] result", { from: fromLang, to: toLang, translated });
  return translated;
}

// ── Step 2: Design brief (multimodal, sees images) ──────────────

async function generateDesignBrief(
  inspirationImages: { image: Buffer; mediaType: string }[],
  productImage: CompressedImage,
  logoImage: CompressedImage,
  category: string
): Promise<string> {
  const contentParts: Array<
    | { type: "image"; image: Buffer; mediaType: string }
    | { type: "text"; text: string }
  > = [];

  let imageContext = "";
  if (inspirationImages.length > 0) {
    for (const img of inspirationImages) {
      contentParts.push({ type: "image" as const, image: img.image, mediaType: img.mediaType });
    }
    imageContext += `The first ${inspirationImages.length} image(s) are professional reference poster designs.\n`;
  }
  if (productImage) {
    contentParts.push({ type: "image" as const, image: productImage.image, mediaType: productImage.mediaType });
    imageContext += `The ${inspirationImages.length > 0 ? "next" : "first"} image is the product/meal photo.\n`;
  }
  if (logoImage) {
    contentParts.push({ type: "image" as const, image: logoImage.image, mediaType: logoImage.mediaType });
    imageContext += `The last image is the business logo.\n`;
  }

  if (contentParts.length === 0) return "";

  const prompt = `You are a creative director preparing a brief for a graphic designer creating a ${category} marketing poster.

## IMAGE CONTEXT
${imageContext}

## YOUR TASK
Analyze ALL provided images and write a SHORT design brief (3-5 sentences) covering:
${inspirationImages.length > 0 ? `- **Inspiration style**: Layout structure, composition, and element placement from the reference posters. Do NOT describe or recommend the inspiration color scheme — colors must come from the logo only.` : ""}
${productImage ? `- **Product**: What exactly is shown in the product photo? Be specific (e.g., "a pepperoni pizza on a red ceramic plate").` : ""}
${logoImage ? `- **Logo**: Describe the logo's visual appearance (colors, shape, text). The designer must embed this logo image as-is — NEVER redraw it. IMPORTANT: The logo's dominant colors MUST be the primary color palette for the entire poster design.` : ""}
- **Layout suggestion**: A clean layout approach based on the inspiration and product.

Respond with ONLY the brief text. No JSON, no headers.`;

  contentParts.push({ type: "text" as const, text: prompt });

  const result = await generateText({
    model: translationModel,
    messages: [{ role: "user" as const, content: contentParts }],
  });

  return result.text.trim();
}

// ── Main entry point ────────────────────────────────────────────

/**
 * Multimodal context preparation step:
 * 1. Translates text fields using Gemini 2.5 Pro (text-only call with Google Search)
 * 2. Generates design brief from visual analysis (multimodal call)
 *
 * These are TWO SEPARATE calls to avoid fragile combined JSON parsing.
 * Must be called AFTER image compression, BEFORE prompt building.
 */
export async function prepareContext(
  data: PostFormData,
  resolvedLanguage: ResolvedLanguage,
  inspirationImages: { image: Buffer; mediaType: string }[],
  productImage: CompressedImage,
  logoImage: CompressedImage
): Promise<ContextPrepResult> {
  const inputLang = detectInputLanguage(data);
  const needsTranslation = inputLang !== resolvedLanguage;
  const fields = extractTranslatableFields(data);

  console.info("[contextPrep] starting", {
    inputLang,
    resolvedLanguage,
    needsTranslation,
    fieldCount: Object.keys(fields).length,
    fieldKeys: Object.keys(fields),
    inspirationCount: inspirationImages.length,
    hasProduct: !!productImage,
    hasLogo: !!logoImage,
  });

  const startMs = Date.now();
  let translatedData = data;
  let wasTranslated = false;
  let designBrief: string | null = null;
  let translatedDropdowns: ContextPrepResult["translatedDropdowns"] = null;

  // Step 1: Translation (only if languages differ)
  if (needsTranslation && Object.keys(fields).length > 0) {
    try {
      const translations = await translateFields(fields, inputLang, resolvedLanguage);

      // Extract translated dropdown values before applying to data
      const dropdowns: NonNullable<ContextPrepResult["translatedDropdowns"]> = {};
      if (translations["_offerBadgeText"]) {
        dropdowns.offerBadgeText = translations["_offerBadgeText"];
        delete translations["_offerBadgeText"];
      }
      if (translations["_deliveryText"]) {
        dropdowns.deliveryText = translations["_deliveryText"];
        delete translations["_deliveryText"];
      }
      if (Object.keys(dropdowns).length > 0) {
        translatedDropdowns = dropdowns;
      }

      translatedData = applyTranslations(data, translations);
      wasTranslated = true;

      console.info("[contextPrep] translation applied", {
        from: inputLang,
        to: resolvedLanguage,
        original: fields,
        translated: translations,
        dropdowns: translatedDropdowns,
      });
    } catch (err) {
      console.error("[contextPrep] translation FAILED — using original data", err);
    }
  }

  // Step 2: Design brief (independent — runs even if translation fails)
  try {
    designBrief = await generateDesignBrief(
      inspirationImages,
      productImage,
      logoImage,
      data.category
    );
    console.info("[contextPrep] design brief generated", {
      length: designBrief.length,
      preview: designBrief.slice(0, 200),
    });
  } catch (err) {
    console.error("[contextPrep] design brief FAILED — continuing without it", err);
  }

  console.info("[contextPrep] done", {
    wasTranslated,
    hasDesignBrief: !!designBrief,
    hasDropdowns: !!translatedDropdowns,
    totalMs: Date.now() - startMs,
  });

  return { data: translatedData, wasTranslated, designBrief, translatedDropdowns };
}

// ── Menu Context Prep ───────────────────────────────────────────

export type MenuContextPrepResult = {
  data: MenuFormData;
  wasTranslated: boolean;
  designBrief: string | null;
};

/** Detect input language from menu form text fields */
function detectMenuInputLanguage(data: MenuFormData): ResolvedLanguage {
  const signals = [
    data.businessName,
    data.address ?? "",
    ...data.items.map((i) => i.name),
  ].join(" ");
  // Reuse the same script detection logic
  const cleaned = signals.replace(/[0-9٠-٩]/g, " ").replace(/[_\-./\\|()[\]{}<>:;,+*=~`!@#$%^&?"']/g, " ").trim();
  if (!cleaned) return "en";
  const ar = (cleaned.match(/[\u0600-\u06FF]/g) || []).length;
  const he = (cleaned.match(/[\u0590-\u05FF]/g) || []).length;
  const la = (cleaned.match(/[A-Za-z]/g) || []).length;
  const max = Math.max(ar, he, la);
  if (max === 0) return "en";
  if (ar === max) return "ar";
  if (he === max) return "he";
  return "en";
}

/** Extract menu fields for translation: item names, prices, address */
function extractMenuTranslatableFields(data: MenuFormData): Record<string, string> {
  const fields: Record<string, string> = {};
  data.items.forEach((item, i) => {
    fields[`item_${i}_name`] = item.name;
    fields[`item_${i}_price`] = item.price;
    if (item.oldPrice) fields[`item_${i}_oldPrice`] = item.oldPrice;
  });
  if (data.address) fields["address"] = data.address;
  return fields;
}

/** Apply translated fields back to MenuFormData */
function applyMenuTranslations(data: MenuFormData, translations: Record<string, string>): MenuFormData {
  const clone: MenuFormData = {
    ...data,
    items: data.items.map((item, i) => ({
      ...item,
      name: translations[`item_${i}_name`] || item.name,
      price: translations[`item_${i}_price`] || item.price,
      oldPrice: translations[`item_${i}_oldPrice`] || item.oldPrice,
    })),
    address: translations["address"] || data.address,
  };
  return clone;
}

/**
 * Menu-specific context preparation:
 * 1. Translates item names, prices, address
 * 2. Generates design brief from inspiration + item images + logo
 */
export async function prepareMenuContext(
  data: MenuFormData,
  resolvedLanguage: ResolvedLanguage | "auto",
  inspirationImages: { image: Buffer; mediaType: string }[],
  itemImages: (CompressedImage)[],
  logoImage: CompressedImage
): Promise<MenuContextPrepResult> {
  const inputLang = detectMenuInputLanguage(data);
  // "auto" means use the detected language — no translation needed
  const targetLang = resolvedLanguage === "auto" ? inputLang : resolvedLanguage;
  const needsTranslation = inputLang !== targetLang;
  const fields = extractMenuTranslatableFields(data);

  console.info("[menuContextPrep] starting", {
    inputLang,
    resolvedLanguage,
    needsTranslation,
    fieldCount: Object.keys(fields).length,
    itemCount: data.items.length,
  });

  const startMs = Date.now();
  let translatedData = data;
  let wasTranslated = false;
  let designBrief: string | null = null;

  // Step 1: Translation
  if (needsTranslation && Object.keys(fields).length > 0) {
    try {
      const translations = await translateFields(fields, inputLang, targetLang);
      translatedData = applyMenuTranslations(data, translations);
      wasTranslated = true;

      console.info("[menuContextPrep] translation applied", {
        from: inputLang,
        to: targetLang,
        itemCount: data.items.length,
      });
    } catch (err) {
      console.error("[menuContextPrep] translation FAILED — using original data", err);
    }
  }

  // Step 2: Design brief
  try {
    const allImages = [...itemImages.filter(Boolean) as { image: Buffer; mediaType: string }[]];
    designBrief = await generateDesignBrief(
      inspirationImages,
      allImages[0] ?? null,
      logoImage,
      data.menuCategory
    );
  } catch (err) {
    console.error("[menuContextPrep] design brief FAILED", err);
  }

  console.info("[menuContextPrep] done", {
    wasTranslated,
    hasDesignBrief: !!designBrief,
    totalMs: Date.now() - startMs,
  });

  return { data: translatedData, wasTranslated, designBrief };
}
