"use server";

import { generateText } from "ai";
import { marketingContentModel, google } from "@/lib/ai";
import { detectInputLanguage } from "@/lib/resolved-language";
import type { PostFormData } from "@/lib/types";
import type { ResolvedLanguage } from "@/lib/resolved-language";

// ── Translatable field definitions per category ─────────────────
// Excludes: business names (proper nouns), prices, WhatsApp, CTA,
// offerBadge, deliveryType (handled by static lookup tables).

const TRANSLATABLE_FIELDS: Record<string, string[]> = {
  restaurant: ["mealName", "description", "offerDuration"],
  supermarket: ["productName", "offerDuration"],
  ecommerce: ["productName", "features", "shippingDuration"],
  services: [
    "serviceName",
    "serviceDetails",
    "coverageArea",
    "executionTime",
    "warranty",
    "quickFeatures",
    "offerDuration",
  ],
  fashion: [
    "itemName",
    "description",
    "availableSizes",
    "availableColors",
    "offerNote",
    "offerDuration",
  ],
  beauty: ["serviceName", "benefit", "sessionDuration", "suitableFor", "offerDuration"],
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

  const prompt = `Translate the following marketing text from ${fromName} to ${toName}.

CRITICAL RULES:
- Use REAL native ${toName} vocabulary — do NOT transliterate (rewrite in different script)
- Example: Arabic "بطاطس" → Hebrew must be "צ'יפס" (proper Hebrew word), NOT "בטאטס" (Arabic in Hebrew letters)
- Example: Arabic "توصيل مجاني" → Hebrew must be "משלוח חינם", NOT "תוצ'יל מג'אני"
- Preserve the marketing meaning and keep translations concise (they must fit on a poster)
- Prices, numbers, phone numbers, and URLs must remain unchanged
- If a value is already in ${toName}, return it unchanged

Use Google Search if you need to verify the correct ${toName} word for any term.

Fields to translate:
${fieldList}

Respond with ONLY a valid JSON object mapping field names to translated values. No markdown, no explanation.`;

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
