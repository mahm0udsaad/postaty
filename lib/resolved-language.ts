import type { PostFormData } from "./types";

/** Known language codes, or a freeform string for "other" languages. */
export type ResolvedLanguage = "ar" | "he" | "en" | "fr" | "de" | "tr" | (string & {});

function stripNoise(input: string): string {
  return input
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[0-9٠-٩]/g, " ")
    .replace(/[_\-./\\|()[\]{}<>:;,+*=~`!@#$%^&?"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

/**
 * Returns only user-typed free-text fields for language detection.
 * Excludes dropdown/select fields (cta, offerBadge, deliveryType, postType,
 * availability, serviceType, priceType, bookingCondition) because their
 * values are determined by the UI locale, not the user's intended language.
 */
function getFreeTextSignals(data: PostFormData): string[] {
  switch (data.category) {
    case "restaurant":
      return [
        data.restaurantName,
        data.mealName,
        data.description ?? "",
        data.coverageAreas ?? "",
        data.offerDuration ?? "",
      ];
    case "supermarket":
      return [
        data.supermarketName,
        data.productName,
        data.quantity ?? "",
        data.offerLimit ?? "",
        data.offerDuration ?? "",
      ];
    case "ecommerce":
      return [
        data.shopName,
        data.productName,
        data.features ?? "",
        data.colorSize ?? "",
        data.shippingDuration ?? "",
      ];
    case "services":
      return [
        data.businessName,
        data.serviceName,
        data.serviceDetails ?? "",
        data.coverageArea ?? "",
        data.quickFeatures ?? "",
        data.offerDuration ?? "",
      ];
    case "fashion":
      return [
        data.brandName,
        data.itemName,
        data.description ?? "",
        data.availableSizes ?? "",
        data.availableColors ?? "",
        data.offerNote ?? "",
        data.offerDuration ?? "",
      ];
    case "beauty":
      return [
        data.salonName,
        data.serviceName,
        data.benefit ?? "",
        data.suitableFor ?? "",
        data.offerDuration ?? "",
      ];
  }
}

/**
 * Detects the language of the user's input text (ignoring posterLanguage setting).
 * Used by pre-translation to determine if translation is needed.
 */
export function detectInputLanguage(data: PostFormData): ResolvedLanguage {
  const rawText = getFreeTextSignals(data).join(" ");
  const text = stripNoise(rawText);
  if (!text) return "en";

  const arabicCount = countMatches(text, /[\u0600-\u06FF]/g);
  const hebrewCount = countMatches(text, /[\u0590-\u05FF]/g);
  const latinCount = countMatches(text, /[A-Za-z]/g);

  const maxCount = Math.max(arabicCount, hebrewCount, latinCount);
  if (maxCount === 0) return "en";
  if (arabicCount === maxCount) return "ar";
  if (hebrewCount === maxCount) return "he";
  return "en";
}

export function resolvePosterLanguage(data: PostFormData): ResolvedLanguage {
  // If the user explicitly chose a language in the form, use it directly.
  if (data.posterLanguage) {
    return data.posterLanguage as ResolvedLanguage;
  }

  // Fallback: auto-detect from free-text fields.
  const rawText = getFreeTextSignals(data).join(" ");
  const text = stripNoise(rawText);
  if (!text) return "en";

  const arabicCount = countMatches(text, /[\u0600-\u06FF]/g);
  const hebrewCount = countMatches(text, /[\u0590-\u05FF]/g);
  const latinCount = countMatches(text, /[A-Za-z]/g);

  // Strong script signal wins.
  const maxCount = Math.max(arabicCount, hebrewCount, latinCount);
  if (maxCount === 0) return "en";
  if (arabicCount === maxCount) return "ar";
  if (hebrewCount === maxCount) return "he";
  return "en";
}
