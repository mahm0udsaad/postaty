import type { PostFormData } from "./types";

export type ResolvedLanguage = "ar" | "he" | "en";

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

function getFreeTextSignals(data: PostFormData): string[] {
  switch (data.category) {
    case "restaurant":
      return [
        data.restaurantName,
        data.mealName,
        data.description ?? "",
        data.coverageAreas ?? "",
        data.offerDuration ?? "",
        data.cta ?? "",
      ];
    case "supermarket":
      return [
        data.supermarketName,
        data.productName,
        data.quantity ?? "",
        data.offerLimit ?? "",
        data.offerDuration ?? "",
        data.cta ?? "",
      ];
    case "ecommerce":
      return [
        data.shopName,
        data.productName,
        data.features ?? "",
        data.colorSize ?? "",
        data.shippingDuration ?? "",
        data.cta ?? "",
      ];
    case "services":
      return [
        data.businessName,
        data.serviceName,
        data.serviceDetails ?? "",
        data.coverageArea ?? "",
        data.quickFeatures ?? "",
        data.offerDuration ?? "",
        data.cta ?? "",
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
        data.cta ?? "",
      ];
    case "beauty":
      return [
        data.salonName,
        data.serviceName,
        data.benefit ?? "",
        data.suitableFor ?? "",
        data.offerDuration ?? "",
        data.cta ?? "",
      ];
  }
}

export function resolvePosterLanguage(data: PostFormData): ResolvedLanguage {
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
