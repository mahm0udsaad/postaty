"use server";

import { generateText } from "ai";
import { marketingContentModel, google } from "@/lib/ai";
import { detectInputLanguage } from "@/lib/resolved-language";
import type { PostFormData } from "@/lib/types";
import type { ResolvedLanguage } from "@/lib/resolved-language";

// ── Translatable field definitions per category ─────────────────
// Excludes: business names (proper nouns), WhatsApp, CTA,
// offerBadge, deliveryType (handled by static lookup tables).
// Includes: prices (they often contain currency names like "درهم" that need translation).

const TRANSLATABLE_FIELDS: Record<string, string[]> = {
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

// ── Helpers ─────────────────────────────────────────────────────

function extractTranslatableFields(data: PostFormData): Record<string, string> {
  const fieldNames = TRANSLATABLE_FIELDS[data.category] ?? [];
  const result: Record<string, string> = {};
  for (const field of fieldNames) {
    const value = (data as unknown as Record<string, unknown>)[field];
    if (typeof value === "string" && value.trim()) {
      result[field] = value;
    }
  }
  return result;
}

async function translateFieldsBatch(
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
   - CORRECT: Arabic "توصيل مجاني" → Hebrew "משלוח חינם"
   - WRONG: Arabic "درهم" → Hebrew "דרהם"
   - CORRECT: Arabic "درهم" → Hebrew "דירהם"

2. For PRICE fields (newPrice, oldPrice, price): translate the currency name but keep the number exactly the same.
   - Arabic "20 درهم" → Hebrew "20 דירהם"
   - Arabic "٥٠ جنيه" → Hebrew "50 שקל" (convert Arabic numerals ٠١٢٣٤٥٦٧٨٩ to Western 0123456789)
   - Arabic "100 ريال" → Hebrew "100 ריאל"

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
    model: marketingContentModel,
    tools: { google_search: google.tools.googleSearch({}) },
    prompt,
  });

  // Parse JSON response
  let cleaned = result.text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  const parsed = JSON.parse(cleaned);

  // Per-field fallback: keep original if translation is missing or empty
  const translated: Record<string, string> = {};
  for (const [key, val] of entries) {
    translated[key] =
      typeof parsed[key] === "string" && parsed[key].trim() ? parsed[key] : val;
  }
  return translated;
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

// ── Main entry point ────────────────────────────────────────────

/**
 * Pre-translate form fields if the user's input language differs
 * from the resolved poster language. Returns the (possibly translated)
 * data and a flag indicating whether translation occurred.
 */
export async function preTranslateIfNeeded(
  data: PostFormData,
  resolvedLanguage: ResolvedLanguage
): Promise<{ data: PostFormData; wasTranslated: boolean }> {
  const inputLang = detectInputLanguage(data);

  // Same language → no translation needed
  if (inputLang === resolvedLanguage) {
    return { data, wasTranslated: false };
  }

  const fields = extractTranslatableFields(data);
  if (Object.keys(fields).length === 0) {
    return { data, wasTranslated: false };
  }

  try {
    console.info("[preTranslate] translating", {
      from: inputLang,
      to: resolvedLanguage,
      fieldCount: Object.keys(fields).length,
    });

    const translated = await translateFieldsBatch(fields, inputLang, resolvedLanguage);
    const translatedData = applyTranslations(data, translated);

    console.info("[preTranslate] success", {
      from: inputLang,
      to: resolvedLanguage,
      fields: Object.keys(translated),
    });

    return { data: translatedData, wasTranslated: true };
  } catch (err) {
    // Graceful fallback: if translation fails, proceed with original data
    console.warn("[preTranslate] failed, falling back to original data", err);
    return { data, wasTranslated: false };
  }
}
