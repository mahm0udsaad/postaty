import type { PostFormData, Category, CampaignType } from "./types";
import type { BrandKitPromptData } from "./prompts";

// ── Category Color Guidance ───────────────────────────────────────

const CATEGORY_STYLES: Record<Category, string> = {
  restaurant: `Category: Restaurant / مطاعم
Color palette: warm tones — reds, terracotta, golds, cream.
Style: appetizing, inviting, food-focused. The meal image should be the hero element.
Make the price prominent with a bold but clean badge or pill.`,

  supermarket: `Category: Supermarket / سوبر ماركت
Color palette: fresh and energetic — warm reds, greens, yellows, creams.
Style: clean retail aesthetic, bold price tags, discount badges.
Multiple products can be displayed. Headline should be prominent.`,

  online: `Category: Online Store / منتجات أونلاين
Color palette: modern — deep teals, warm neutrals, bold accent color.
Style: clean e-commerce aesthetic, minimalist but impactful.
Product on clean background, trust badges, shipping info visible.`,
};

const CAMPAIGN_STYLE_GUIDANCE: Record<CampaignType, string> = {
  standard: "",
  ramadan: `Campaign: Ramadan special (MENA)
Palette: deep indigo/navy, warm gold, emerald accents, soft cream.
Motifs: subtle crescent moon, lantern, or geometric arabesque pattern watermark (very low opacity).
Tone: calm, premium, spiritual yet modern. Avoid clutter and cartoonish icons.`,
  eid: `Campaign: Eid offer (MENA)
Palette: warm gold, celebratory green, clean neutrals.
Motifs: minimal sparkles, starbursts, confetti dots (small and tasteful).
Tone: joyful, premium, modern. Keep the layout clean and balanced.`,
};

// ── Image Generation System Prompt ───────────────────────────────

export function getImageDesignSystemPrompt(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): string {
  let prompt = `You are an expert Arabic graphic designer creating a professional social media marketing poster for MENA audiences.

Generate a SINGLE high-quality poster IMAGE (1080x1080 pixels, square format).

${CATEGORY_STYLES[data.category]}
${CAMPAIGN_STYLE_GUIDANCE[data.campaignType] ? `\n${CAMPAIGN_STYLE_GUIDANCE[data.campaignType]}\n` : ""}
## Design Requirements
- ALL text in the poster MUST be in Arabic
- RTL direction for all Arabic text
- Headlines and prices: LARGE and bold (think billboard)
- Limit palette to 3-4 colors (plus white/black)
- Strong visual hierarchy: hero element > price > CTA > details
- Professional studio-quality composition
- Feature the provided product/meal image prominently
- Include the provided business logo

## Visual References
You will receive reference poster designs. Match or exceed their professional quality while creating an original design.`;

  if (brandKit) {
    prompt += `\n\n## Brand Kit (MUST follow)\n- Primary: ${brandKit.palette.primary}\n- Secondary: ${brandKit.palette.secondary}\n- Accent: ${brandKit.palette.accent}\n- Background: ${brandKit.palette.background}\n- Text: ${brandKit.palette.text}`;
    if (brandKit.styleAdjectives.length > 0) {
      prompt += `\n- Style: ${brandKit.styleAdjectives.join(", ")}`;
    }
    if (brandKit.doRules.length > 0) {
      prompt += `\n- DO: ${brandKit.doRules.join("; ")}`;
    }
    if (brandKit.dontRules.length > 0) {
      prompt += `\n- DON'T: ${brandKit.dontRules.join("; ")}`;
    }
  }

  return prompt;
}

// ── Image Generation User Message ─────────────────────────────────

export function getImageDesignUserMessage(data: PostFormData): string {
  switch (data.category) {
    case "restaurant":
      return `Create a professional poster image for this restaurant offer:
- Restaurant Name: ${data.restaurantName}
- Meal Name: ${data.mealName}
- New Price: ${data.newPrice}
- Old Price: ${data.oldPrice}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${data.campaignType !== "standard" ? `- Campaign Type: ${data.campaignType}` : ""}

The meal photo and restaurant logo are provided as images in this message.
Include: restaurant name, meal name, new price (large), old price (strikethrough), CTA, WhatsApp number, and a discount badge.`;

    case "supermarket":
      return `Create a professional poster image for this supermarket offer:
- Supermarket Name: ${data.supermarketName}
- Product Name: ${data.productName}
${data.weight ? `- Weight/Size: ${data.weight}` : ""}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- Headline: ${data.headline}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${data.campaignType !== "standard" ? `- Campaign Type: ${data.campaignType}` : ""}

The product photo and supermarket logo are provided as images in this message.
Include: supermarket name, headline, product name, CTA, WhatsApp number, and offer badges.`;

    case "online":
      return `Create a professional poster image for this online store product:
- Shop Name: ${data.shopName}
- Product Name: ${data.productName}
- Price: ${data.price}
${data.discount ? `- Discount: ${data.discount}` : ""}
- Shipping: ${data.shipping === "free" ? "مجاني (Free)" : "مدفوع (Paid)"}
- Headline: ${data.headline}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${data.campaignType !== "standard" ? `- Campaign Type: ${data.campaignType}` : ""}

The product photo and shop logo are provided as images in this message.
Include: shop name, headline, product name, price, shipping info, CTA, WhatsApp number.${data.discount ? " Add a discount badge." : ""}`;
  }
}
