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

// ── Gift Image Prompt (visual-only, no text) ─────────────────────

const GIFT_CATEGORY_VIBES: Record<Category, string> = {
  restaurant: `warm, appetizing tones — rich reds, golden amber, terracotta. Food photography style lighting with soft bokeh and steam effects.`,
  supermarket: `fresh, vibrant tones — lush greens, bright reds, sunny yellows. Clean retail aesthetic with dynamic composition and fresh produce feel.`,
  online: `modern, sleek tones — deep teals, soft gradients, metallic accents. E-commerce style with elegant lighting and premium product presentation.`,
};

export function getGiftImageSystemPrompt(data: PostFormData): string {
  return `You are an expert visual designer creating a beautiful promotional image.

CRITICAL RULES — follow these EXACTLY:
1. Generate ABSOLUTELY NO TEXT of any kind — no Arabic, no English, no numbers, no watermarks, no labels, no prices, no letters
2. The business logo image is provided — include it in the design EXACTLY as given. Do NOT modify, redraw, stylize, or add text to the logo
3. Feature the product/meal image as the hero visual element
4. Create a stunning visual composition using ONLY:
   - The product photo (prominent, hero placement)
   - The logo (placed naturally, unmodified)
   - Abstract visual elements: gradients, light rays, bokeh circles, geometric patterns, flowing shapes
   - Color harmony and professional lighting effects
   - Subtle decorative elements: sparkles, glow effects, color splashes

Visual mood: ${GIFT_CATEGORY_VIBES[data.category]}

Output: A single 1080x1080 square image. Pure visual art — zero text.`;
}

export function getGiftImageUserMessage(data: PostFormData): string {
  return `Create a visually stunning promotional image with NO TEXT whatsoever.

The first image is the product/meal — make it the hero of the composition.
The second image is the business logo — place it naturally in the design WITHOUT any modification.

Use beautiful visual elements: abstract shapes, gradient overlays, light effects, bokeh, and color harmony. Make it look premium and eye-catching.

Remember: ZERO text, ZERO numbers, ZERO letters. Only visuals.`;
}
