import type { PostFormData, BrandPalette, CampaignType, Category } from "./types";
import { DEFAULT_NEGATIVE_PROMPTS } from "./constants";

// ── Base Instructions ──────────────────────────────────────────────

const BASE_INSTRUCTIONS = `You are an expert graphic designer specializing in social media marketing posters.

Your task is to create a detailed image generation prompt that will produce a professional, eye-catching social media offer poster.

CRITICAL REQUIREMENTS:
- Detect the language of the user's input (business name, product name, description, CTA, etc.)
- ALL text on the poster MUST be in the SAME language as the user's input — including CTA buttons, labels, currency text, WhatsApp label, and any other UI text
- Do NOT mix languages: if the user writes in Hebrew, ALL poster text must be in Hebrew; if in French, ALL in French; if in the user's language, ALL in the user's language; etc.
- For RTL languages (Arabic, Hebrew): use RTL text direction
- For LTR languages (English, French, Turkish, etc.): use LTR text direction
- The poster should look like a professional marketing material
- Use vibrant, attention-grabbing colors
- The product/meal image provided by the user must be the focal point
- The business logo must be visible and well-placed
- Price must be large and prominent with a bold design
- WhatsApp number should be displayed with a WhatsApp icon
- CTA button should be clearly visible
- The design should feel modern, clean, and trustworthy
- Aim for a Canva-inspired template aesthetic: clean panels, bold typography, tasteful badges, and clear hierarchy

OUTPUT: Return ONLY the image generation prompt text. No explanations or additional text.`;

// ── Category-specific prompts ──────────────────────────────────────

const CATEGORY_PROMPTS: Record<Category, string> = {
  restaurant: `${BASE_INSTRUCTIONS}

CATEGORY: Restaurant / مطاعم وكافيهات
STYLE: Warm, appetizing food photography style. Rich reds, golds, and warm tones. The meal should look delicious and irresistible. Include visual elements like steam, fresh ingredients, or garnishes around the meal image.

The poster should include:
1. Restaurant logo (top area)
2. Restaurant name in bold text
3. Meal image (center, large and appetizing)
4. Meal name in the user's language
5. New price (very large, bold, in a bright circle or badge)
6. Old price (smaller, with strikethrough)
7. Offer badge if provided (discount/new/bestseller)
8. Delivery info if applicable
9. WhatsApp button with number
10. CTA text in a prominent button`,

  supermarket: `${BASE_INSTRUCTIONS}

CATEGORY: Supermarket / سوبر ماركت
STYLE: Clean, organized retail aesthetic. Bright yellows, reds, and greens typical of supermarket flyers. Multiple products should be arranged attractively. Bold price tags and discount badges.

The poster should include:
1. Supermarket logo (top area)
2. Supermarket name in bold text
3. Product image(s) (center, well-arranged)
4. Product name in the user's language
5. New price (very large, bold, in a price tag style)
6. Old price (smaller, with strikethrough)
7. Discount percentage badge
8. Offer limit and expiry if provided
9. WhatsApp button with number
10. CTA text in a prominent button`,

  ecommerce: `${BASE_INSTRUCTIONS}

CATEGORY: E-commerce / متاجر إلكترونية
STYLE: Modern e-commerce aesthetic. Clean whites, brand-colored accents, professional product photography feel. Minimalist but impactful. Trust badges, shipping icons.

The poster should include:
1. Shop logo (top area)
2. Shop name in the user's language
3. Product image (center, clean background)
4. Product name and key features in the user's language
5. New price (large, bold) and old price (strikethrough)
6. Availability status badge
7. Shipping/delivery duration info
8. WhatsApp button with number
9. CTA text in a prominent button`,

  services: `${BASE_INSTRUCTIONS}

CATEGORY: Services / خدمات
STYLE: Professional, trust-building aesthetic. Clean blues, navies, whites, and subtle golds. Icon-driven design elements. Clear service information hierarchy.

The poster should include:
1. Business logo (top area)
2. Business name in bold text
3. Service type badge
4. Service name and details in the user's language
5. Price (with "fixed" or "starting from" indicator)
6. Execution time/visit duration
7. Coverage area
8. Warranty/certification badge if provided
9. Quick features (3 key points)
10. WhatsApp button with number
11. CTA text in a prominent button`,

  fashion: `${BASE_INSTRUCTIONS}

CATEGORY: Fashion / أزياء وموضة
STYLE: Elegant editorial aesthetic. Soft blacks, blush pinks, rose gold accents, neutral tones. Magazine-style layout with garment/accessory as hero. Aspirational and stylish.

The poster should include:
1. Brand logo (top area)
2. Brand name in stylish typography
3. Product image (center, fashion-forward presentation)
4. Item name in the user's language
5. New price (large, bold) and old price (strikethrough)
6. Available sizes line
7. Available colors line
8. Offer note if provided (e.g., second item -50%)
9. WhatsApp button with number
10. CTA text in a prominent button`,

  beauty: `${BASE_INSTRUCTIONS}

CATEGORY: Beauty & Care / تجميل وعناية
STYLE: Soft, feminine, spa-like aesthetic. Pinks, golds, soft lilacs, creamy whites. Dreamy bokeh effects, soft glow. Product or treatment result as hero. Premium and luxurious feel.

The poster should include:
1. Salon/spa logo (top area)
2. Salon/spa name in elegant text
3. Service/product image (center, glowing presentation)
4. Service/product name in the user's language
5. Key benefit/result (e.g., moisturizing + glow)
6. New price (large, bold) and old price (strikethrough)
7. Session duration or product size
8. Suitable for (skin type/category)
9. Booking condition (advance/available now)
10. WhatsApp button with number
11. CTA text in a prominent button`,
};

// ── Campaign Type Hints ────────────────────────────────────────────

const CAMPAIGN_STYLE_HINTS: Record<CampaignType, string> = {
  standard: "",
  ramadan: `CAMPAIGN: Ramadan special / عروض رمضان
Style: calm, premium, spiritual but modern. Use deep midnight blues, emeralds, warm golds, and soft creams.
Decor: subtle geometric/arabesque pattern watermark (very low opacity), crescent moon or lantern motif (minimal, not cartoonish).
Copy: you may include a gentle greeting like "رمضان كريم" if it fits the layout.`,
  eid: `CAMPAIGN: Eid offer / عروض العيد
Style: celebratory, joyful, modern. Use warm gold, green, and clean neutrals with high contrast.
Decor: small starbursts, confetti dots, or sparkle accents (kept minimal and tidy).
Copy: you may include a short greeting like "عيد مبارك" or "كل عام وأنتم بخير" if it fits the layout.`,
};

function buildCampaignSection(campaignType: CampaignType): string {
  const hint = CAMPAIGN_STYLE_HINTS[campaignType];
  return hint ? `\n\n${hint}` : "";
}

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
  data: PostFormData,
  brandKit?: BrandKitPromptData
): string {
  let prompt = CATEGORY_PROMPTS[data.category];

  prompt += buildCampaignSection(data.campaignType);

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
- Post Type: ${data.postType}
- Meal Name: ${data.mealName}
${data.description ? `- Description: ${data.description}` : ""}
- New Price: ${data.newPrice}
- Old Price: ${data.oldPrice}
${data.offerBadge ? `- Offer Badge: ${data.offerBadge}` : ""}
${data.deliveryType ? `- Delivery: ${data.deliveryType === "free" ? "Free" : "Paid"}` : ""}
${data.deliveryTime ? `- Delivery Time: ${data.deliveryTime}` : ""}
${data.coverageAreas ? `- Coverage Areas: ${data.coverageAreas}` : ""}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${data.campaignType !== "standard" ? `- Campaign Type: ${data.campaignType}` : ""}

The user has uploaded the meal image and restaurant logo. Describe the poster incorporating these images.`;

    case "supermarket":
      return `Create a poster for this supermarket offer:
- Supermarket Name: ${data.supermarketName}
- Post Type: ${data.postType}
- Product Name: ${data.productName}
${data.quantity ? `- Quantity/Weight: ${data.quantity}` : ""}
- New Price: ${data.newPrice}
- Old Price: ${data.oldPrice}
${data.discountPercentage ? `- Discount: ${data.discountPercentage}%` : ""}
${data.offerLimit ? `- Offer Limit: ${data.offerLimit}` : ""}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
${data.expiryDate ? `- Expiry Date: ${data.expiryDate}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
- Number of product images: ${data.productImages.length}
${data.campaignType !== "standard" ? `- Campaign Type: ${data.campaignType}` : ""}

The user has uploaded ${data.productImages.length} product image(s) and the supermarket logo. Describe the poster incorporating these images.`;

    case "ecommerce":
      return `Create a poster for this e-commerce product:
- Shop Name: ${data.shopName}
- Post Type: ${data.postType}
- Product Name: ${data.productName}
${data.features ? `- Features: ${data.features}` : ""}
- New Price: ${data.newPrice}
- Old Price: ${data.oldPrice}
${data.colorSize ? `- Color/Size: ${data.colorSize}` : ""}
- Availability: ${data.availability}
${data.shippingDuration ? `- Shipping Duration: ${data.shippingDuration}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${data.campaignType !== "standard" ? `- Campaign Type: ${data.campaignType}` : ""}

The user has uploaded the product image and shop logo. Describe the poster incorporating these images.`;

    case "services":
      return `Create a poster for this service:
- Business Name: ${data.businessName}
- Service Type: ${data.serviceType}
- Service Name: ${data.serviceName}
${data.serviceDetails ? `- Details: ${data.serviceDetails}` : ""}
- Price: ${data.price} (${data.priceType === "fixed" ? "Fixed price" : "Starting from"})
${data.executionTime ? `- Execution Time: ${data.executionTime}` : ""}
${data.coverageArea ? `- Coverage Area: ${data.coverageArea}` : ""}
${data.warranty ? `- Warranty: ${data.warranty}` : ""}
${data.quickFeatures ? `- Key Features: ${data.quickFeatures}` : ""}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${data.campaignType !== "standard" ? `- Campaign Type: ${data.campaignType}` : ""}

The user has uploaded a service image and business logo. Describe the poster incorporating these images.`;

    case "fashion":
      return `Create a poster for this fashion item:
- Brand Name: ${data.brandName}
- Post Type: ${data.postType}
- Item Name: ${data.itemName}
${data.description ? `- Description: ${data.description}` : ""}
- New Price: ${data.newPrice}
- Old Price: ${data.oldPrice}
${data.availableSizes ? `- Available Sizes: ${data.availableSizes}` : ""}
${data.availableColors ? `- Available Colors: ${data.availableColors}` : ""}
${data.offerNote ? `- Offer Note: ${data.offerNote}` : ""}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${data.campaignType !== "standard" ? `- Campaign Type: ${data.campaignType}` : ""}

The user has uploaded the product image and brand logo. Describe the poster incorporating these images.`;

    case "beauty":
      return `Create a poster for this beauty/care offer:
- Salon/Spa Name: ${data.salonName}
- Post Type: ${data.postType}
- Service/Product Name: ${data.serviceName}
${data.benefit ? `- Benefit: ${data.benefit}` : ""}
- New Price: ${data.newPrice}
- Old Price: ${data.oldPrice}
${data.sessionDuration ? `- Session Duration: ${data.sessionDuration}` : ""}
${data.suitableFor ? `- Suitable For: ${data.suitableFor}` : ""}
- Booking: ${data.bookingCondition === "advance" ? "Advance booking" : "Available now"}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${data.campaignType !== "standard" ? `- Campaign Type: ${data.campaignType}` : ""}

The user has uploaded the service/product image and salon logo. Describe the poster incorporating these images.`;
  }
}
