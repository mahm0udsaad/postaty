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

// ── CSS Technique Catalog ────────────────────────────────────────

const CSS_TECHNIQUE_CATALOG = `
## Decoration Rules

CRITICAL: Do NOT use <svg> elements. Use ONLY CSS for all decorative elements.

You have full creative freedom with CSS: clip-path for custom shapes (stars, badges, arches, diamonds), border-radius for organic blobs and circles, CSS gradients (linear, radial, conic, repeating) for patterns and backgrounds, transforms (rotate, scale, skew) for dynamic positioning, box-shadow for glows and depth, and pseudo-elements for layered decorations.

For Islamic/MENA motifs: build crescents from overlapping circles, lanterns from stacked divs, geometric patterns from repeating gradients at multiple angles.

Remember: this is a POSTER being screenshotted, not a web page. Layer aggressively with absolute positioning.
`;

// ── System Prompt ─────────────────────────────────────────────────

export function getPosterDesignSystemPrompt(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): string {
  let prompt = `You are an expert Arabic graphic designer creating professional social media marketing posters for MENA audiences.

## CRITICAL: POSTER IMAGE MINDSET

This HTML will be SCREENSHOTTED into a flat PNG image at 1080x1080 pixels. It is NOT a web page. Nobody will scroll, click, or interact with it. Think like a designer in Photoshop/Canva creating a poster.

What this means for your HTML/CSS:
- Use ABSOLUTE POSITIONING aggressively — layer elements on top of each other for depth
- OVERLAP elements freely — product images can break out of containers, text can overlay images
- Make text HUGE — headlines should be 60-100px, prices 70-120px. This is a poster, not a website
- Use CSS clip-path, transforms (rotate, scale, skew), and border-radius for creative shapes
- Do NOT use <svg> elements — use CSS-only for ALL decorative elements (shapes, sparkles, patterns, badges)
- Use CSS gradients, repeating patterns, and overlays for rich backgrounds
- Every pixel matters — fill the 1080x1080 canvas with intentional design, no wasted whitespace
- Position decorative elements at edges, corners, and around the product for visual richness
- Think in LAYERS: background layer → decoration layer → product layer → text layer

${CATEGORY_STYLES[data.category]}
${CAMPAIGN_STYLE_GUIDANCE[data.campaignType] ? `\n${CAMPAIGN_STYLE_GUIDANCE[data.campaignType]}\n` : ""}
${CSS_TECHNIQUE_CATALOG}

## HTML Output Rules

### Document Structure
The \`html\` field must be a COMPLETE HTML document:
\`\`\`html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
    position: relative;
    font-family: 'Noto Kufi Arabic', sans-serif;
    direction: rtl;
  }
</style>
</head>
<body>
  <!-- poster content here -->
</body>
</html>
\`\`\`

### Image Placeholders
- Use exactly \`{{PRODUCT_IMAGE}}\` as the src for the product/meal image
- Use exactly \`{{LOGO_IMAGE}}\` as the src for the business logo
- Example: \`<img src="{{PRODUCT_IMAGE}}" style="..." />\`
- These placeholders will be replaced with real base64 images before rendering

### Design Fundamentals
- Canvas: ALWAYS 1080x1080px (use px units only)
- ALL text content MUST be in Arabic (natural, readable)
- RTL direction for Arabic text
- Product image: prominent, at least 350px in one dimension
- Logo: smaller (60-100px), positioned per the recipe
- Strong contrast between text and backgrounds
- Target: MENA audiences (no dark mode, no neon aesthetics)

### Typography
- Font: 'Noto Kufi Arabic'
- Headlines and prices should be LARGE (60-120px, heavy weight) — this is a poster, think billboard
- Supporting text, CTAs, and contact info should be readable but secondary
- Strong visual hierarchy: hero text > price > CTA > details

### Quality
- Limit palette to 3-4 colors max (plus white/black) — cohesion over variety
- Every element must feel intentional — professional composition, nothing random
- This should look like a real paid design from a professional studio

## Visual Reference Images — YOUR PRIMARY GUIDE
You will receive 1-3 reference poster designs from the same category. These are your MOST IMPORTANT input.

Study these references deeply:
- COLOR: Match the richness, warmth, and contrast levels you see
- COMPOSITION: Note how elements are layered, how text and images relate spatially
- TYPOGRAPHY: Observe the boldness, scale, and confident use of large text
- ATMOSPHERE: Absorb the overall mood — the feeling these designs create
- POLISH: Match the professional finish — clean edges, consistent spacing, intentional decoration

The creative brief below gives you a concept direction. The reference images show the QUALITY BAR your design must meet or exceed.

DO NOT copy any specific layout, text, or branding. CREATE an original design that fits alongside them in the same portfolio.`;

  if (brandKit) {
    prompt += `

## Brand Kit (MUST follow these constraints)
- Primary Color: ${brandKit.palette.primary}
- Secondary Color: ${brandKit.palette.secondary}
- Accent Color: ${brandKit.palette.accent}
- Background Color: ${brandKit.palette.background}
- Text Color: ${brandKit.palette.text}`;

    if (brandKit.styleAdjectives.length > 0) {
      prompt += `\n- Style: ${brandKit.styleAdjectives.join(", ")}`;
    }
    if (brandKit.doRules.length > 0) {
      prompt += `\n- Brand DO rules: ${brandKit.doRules.join("; ")}`;
    }
    if (brandKit.dontRules.length > 0) {
      prompt += `\n- Brand DON'T rules: ${brandKit.dontRules.join("; ")}`;
    }
  }

  return prompt;
}

// ── User Message ──────────────────────────────────────────────────

export function getPosterDesignUserMessage(data: PostFormData): string {
  switch (data.category) {
    case "restaurant":
      return `Create 1 poster design (as a complete HTML document) for this restaurant offer:
- Restaurant Name: ${data.restaurantName}
- Meal Name: ${data.mealName}
- New Price: ${data.newPrice}
- Old Price: ${data.oldPrice}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${data.campaignType !== "standard" ? `- Campaign Type: ${data.campaignType}` : ""}

Use {{PRODUCT_IMAGE}} for the meal photo and {{LOGO_IMAGE}} for the restaurant logo.
Include: restaurant name, meal name, new price (large), old price (strikethrough style), CTA button, WhatsApp number, and a discount badge.`;

    case "supermarket":
      return `Create 1 poster design (as a complete HTML document) for this supermarket offer:
- Supermarket Name: ${data.supermarketName}
- Product Name: ${data.productName}
${data.weight ? `- Weight/Size: ${data.weight}` : ""}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- Headline: ${data.headline}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${data.campaignType !== "standard" ? `- Campaign Type: ${data.campaignType}` : ""}

Use {{PRODUCT_IMAGE}} for the product photo and {{LOGO_IMAGE}} for the supermarket logo.
Include: supermarket name, headline, product name, CTA button, WhatsApp number, and offer badges.`;

    case "online":
      return `Create 1 poster design (as a complete HTML document) for this online store product:
- Shop Name: ${data.shopName}
- Product Name: ${data.productName}
- Price: ${data.price}
${data.discount ? `- Discount: ${data.discount}` : ""}
- Shipping: ${data.shipping === "free" ? "مجاني (Free)" : "مدفوع (Paid)"}
- Headline: ${data.headline}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${data.campaignType !== "standard" ? `- Campaign Type: ${data.campaignType}` : ""}

Use {{PRODUCT_IMAGE}} for the product photo and {{LOGO_IMAGE}} for the shop logo.
Include: shop name, headline, product name, price, shipping info, CTA button, WhatsApp number.${data.discount ? " Add a discount badge." : ""}`;
  }
}

// ── NanoBanana Pro Prompt (text-to-image) ────────────────────────

export function getNanoBananaPrompt(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): string {
  const categoryStyle = CATEGORY_STYLES[data.category];
  const campaignStyle = CAMPAIGN_STYLE_GUIDANCE[data.campaignType];

  let prompt = `Create a professional Arabic social media marketing poster image (1080x1080 square).

${categoryStyle}
${campaignStyle ? `\n${campaignStyle}\n` : ""}
Design rules:
- ALL text MUST be in Arabic
- RTL text direction
- Headlines and prices: large and bold
- 3-4 color palette max
- Professional studio-quality composition
- Strong visual hierarchy
`;

  switch (data.category) {
    case "restaurant":
      prompt += `
Poster details:
- Restaurant: "${data.restaurantName}"
- Meal: "${data.mealName}"
- New price: ${data.newPrice}
- Old price: ${data.oldPrice} (show strikethrough)
${data.offerDuration ? `- Offer duration: ${data.offerDuration}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA button: "${data.cta}"
- Include a discount badge, the restaurant name as logo text, and make the meal name prominent`;
      break;
    case "supermarket":
      prompt += `
Poster details:
- Supermarket: "${data.supermarketName}"
- Product: "${data.productName}"
${data.weight ? `- Weight/Size: ${data.weight}` : ""}
${data.offerDuration ? `- Offer duration: ${data.offerDuration}` : ""}
- Headline: "${data.headline}"
- WhatsApp: ${data.whatsapp}
- CTA button: "${data.cta}"
- Include offer badges, the supermarket name as logo text, and make the headline prominent`;
      break;
    case "online":
      prompt += `
Poster details:
- Shop: "${data.shopName}"
- Product: "${data.productName}"
- Price: ${data.price}
${data.discount ? `- Discount: ${data.discount}` : ""}
- Shipping: ${data.shipping === "free" ? "Free shipping (مجاني)" : "Paid shipping"}
- Headline: "${data.headline}"
- WhatsApp: ${data.whatsapp}
- CTA button: "${data.cta}"
- Include the shop name as logo text, price prominently, and shipping info${data.discount ? ". Add a discount badge." : ""}`;
      break;
  }

  if (brandKit) {
    prompt += `\n\nBrand colors: primary ${brandKit.palette.primary}, secondary ${brandKit.palette.secondary}, accent ${brandKit.palette.accent}, background ${brandKit.palette.background}, text ${brandKit.palette.text}.`;
    if (brandKit.styleAdjectives.length > 0) {
      prompt += ` Style: ${brandKit.styleAdjectives.join(", ")}.`;
    }
  }

  prompt += `\n\nMake this design unique, bold, and visually striking. Professional quality suitable for Instagram/Facebook.`;

  return prompt;
}

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
