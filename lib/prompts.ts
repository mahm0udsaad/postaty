import type { PostFormData, BrandPalette } from "./types";
import { DEFAULT_NEGATIVE_PROMPTS } from "./constants";

// ── Base Instructions ──────────────────────────────────────────────

const BASE_INSTRUCTIONS = `You are an expert graphic designer specializing in social media marketing posters for businesses in the MENA region (Middle East & North Africa).

Your task is to create a detailed image generation prompt that will produce a professional, eye-catching social media offer poster.

CRITICAL REQUIREMENTS:
- All text on the poster MUST be in Arabic (RTL)
- The poster should look like a professional marketing material
- Use vibrant, attention-grabbing colors typical of MENA market advertising
- The product/meal image provided by the user must be the focal point
- The business logo must be visible and well-placed
- Price must be large and prominent with a bold design
- WhatsApp number should be displayed with a WhatsApp icon
- CTA button should be clearly visible
- The design should feel modern, clean, and trustworthy

OUTPUT: Return ONLY the image generation prompt text. No explanations or additional text.`;

// ── Category-specific prompts ──────────────────────────────────────

const RESTAURANT_PROMPT = `${BASE_INSTRUCTIONS}

CATEGORY: Restaurant / مطاعم
STYLE: Warm, appetizing food photography style. Rich reds, golds, and warm tones. The meal should look delicious and irresistible. Include visual elements like steam, fresh ingredients, or garnishes around the meal image.

The poster should include:
1. Restaurant logo (top area)
2. Restaurant name in bold Arabic
3. Meal image (center, large and appetizing)
4. Meal name in Arabic
5. New price (very large, bold, in a bright circle or badge)
6. Old price (smaller, with strikethrough)
7. Offer duration if provided
8. WhatsApp button with number
9. CTA text in a prominent button`;

const SUPERMARKET_PROMPT = `${BASE_INSTRUCTIONS}

CATEGORY: Supermarket / سوبر ماركت
STYLE: Clean, organized retail aesthetic. Bright yellows, reds, and greens typical of supermarket flyers. Multiple products should be arranged attractively. Bold price tags and discount badges.

The poster should include:
1. Supermarket logo (top area)
2. Supermarket name in bold Arabic
3. Headline text (e.g., "عرض الاسبوع") in a banner
4. Product image(s) (center, well-arranged)
5. Product name in Arabic
6. Weight/size if provided
7. Price in a large bold tag/sticker style
8. Offer duration if provided
9. WhatsApp button with number
10. CTA text in a prominent button`;

const ONLINE_PROMPT = `${BASE_INSTRUCTIONS}

CATEGORY: Online Store / منتجات أونلاين
STYLE: Modern e-commerce aesthetic. Clean whites, brand-colored accents, professional product photography feel. Minimalist but impactful. Trust badges, shipping icons.

The poster should include:
1. Shop logo (top area)
2. Shop name in Arabic
3. Headline text in a stylish banner
4. Product image (center, clean background)
5. Product name in Arabic
6. Price (large, bold)
7. Discount badge if provided
8. Shipping info (مجاني/مدفوع) with delivery icon
9. WhatsApp button with number
10. CTA text in a prominent button`;

// ── Brand Kit Injection ────────────────────────────────────────────

export interface BrandKitPromptData {
  palette: BrandPalette;
  styleAdjectives: string[];
  doRules: string[];
  dontRules: string[];
  styleSeed?: string;
}

function buildBrandKitSection(brandKit: BrandKitPromptData): string {
  const sections: string[] = [];

  sections.push(`--- BRAND KIT ---`);
  sections.push(
    `Primary Color: ${brandKit.palette.primary} | Secondary: ${brandKit.palette.secondary} | Accent: ${brandKit.palette.accent}`
  );
  sections.push(`Background: ${brandKit.palette.background}`);
  sections.push(`Text Color: ${brandKit.palette.text}`);

  if (brandKit.styleAdjectives.length > 0) {
    sections.push(`Style: ${brandKit.styleAdjectives.join(", ")}`);
  }

  if (brandKit.doRules.length > 0) {
    sections.push(`\nBRAND RULES (MUST follow):`);
    brandKit.doRules.forEach((rule) => sections.push(`- DO: ${rule}`));
  }

  if (brandKit.dontRules.length > 0) {
    sections.push(`\nBRAND RESTRICTIONS (MUST NOT do):`);
    brandKit.dontRules.forEach((rule) => sections.push(`- DON'T: ${rule}`));
  }

  sections.push(`---`);

  return sections.join("\n");
}

function buildStyleSeedSection(styleSeed: string): string {
  return `\n--- STYLE REFERENCE ---\nMatch the visual style of this reference design. Maintain the same color treatment, layout density, typography weight, and overall aesthetic:\n${styleSeed}\n---\n`;
}

// ── Negative Prompts ───────────────────────────────────────────────

export function buildNegativePrompts(dontRules: string[] = []): string {
  const negatives: string[] = [...DEFAULT_NEGATIVE_PROMPTS];
  dontRules.forEach((rule) => negatives.push(rule));
  return `\nAVOID: ${negatives.join(", ")}`;
}

// ── Public API ─────────────────────────────────────────────────────

export function getSystemPrompt(
  category: PostFormData["category"],
  brandKit?: BrandKitPromptData
): string {
  let prompt: string;
  switch (category) {
    case "restaurant":
      prompt = RESTAURANT_PROMPT;
      break;
    case "supermarket":
      prompt = SUPERMARKET_PROMPT;
      break;
    case "online":
      prompt = ONLINE_PROMPT;
      break;
  }

  // Inject brand kit if provided
  if (brandKit) {
    prompt += "\n\n" + buildBrandKitSection(brandKit);

    // Inject style seed if locked
    if (brandKit.styleSeed) {
      prompt += "\n" + buildStyleSeedSection(brandKit.styleSeed);
    }

    // Append negative prompts (brand-specific + defaults)
    prompt += "\n" + buildNegativePrompts(brandKit.dontRules);
  } else {
    // Default negative prompts even without brand kit
    prompt += "\n" + buildNegativePrompts();
  }

  return prompt;
}

export function buildUserMessage(data: PostFormData): string {
  switch (data.category) {
    case "restaurant":
      return `Create a poster for this restaurant offer:
- Restaurant Name: ${data.restaurantName}
- Meal Name: ${data.mealName}
- New Price: ${data.newPrice}
- Old Price: ${data.oldPrice}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}

The user has uploaded the meal image and restaurant logo. Describe the poster incorporating these images.`;

    case "supermarket":
      return `Create a poster for this supermarket offer:
- Supermarket Name: ${data.supermarketName}
- Product Name: ${data.productName}
${data.weight ? `- Weight/Size: ${data.weight}` : ""}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- Headline: ${data.headline}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
- Number of product images: ${data.productImages.length}

The user has uploaded ${data.productImages.length} product image(s) and the supermarket logo. Describe the poster incorporating these images.`;

    case "online":
      return `Create a poster for this online product:
- Shop Name: ${data.shopName}
- Product Name: ${data.productName}
- Price: ${data.price}
${data.discount ? `- Discount: ${data.discount}` : ""}
- Shipping: ${data.shipping === "free" ? "مجاني (Free)" : "مدفوع (Paid)"}
- Headline: ${data.headline}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}

The user has uploaded the product image and shop logo. Describe the poster incorporating these images.`;
  }
}
