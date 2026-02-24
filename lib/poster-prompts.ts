import { FORMAT_CONFIGS } from "./constants";
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

  ecommerce: `Category: E-Commerce / متجر إلكتروني
Color palette: modern — deep teals, warm neutrals, bold accent color.
Style: clean e-commerce aesthetic, minimalist but impactful.
Product on clean background, trust badges, shipping info visible.`,

  services: `Category: Services / خدمات
Color palette: professional tones — blues, navies, clean whites, subtle grays.
Style: corporate yet approachable, icon-driven, trust-building.
Service details as clean bullet points. Emphasize reliability and professionalism.`,

  fashion: `Category: Fashion / أزياء
Color palette: elegant editorial tones — blush, neutrals, deep blacks, rose gold.
Style: editorial/magazine feel, garment as hero, aspirational.
Size/color as styled badges. Luxurious and aspirational mood.`,

  beauty: `Category: Beauty / جمال وعناية
Color palette: soft feminine tones — pinks, golds, soft lilacs, creamy whites.
Style: spa-like, dreamy, glowing. Product or session result as hero.
Soft bokeh effects. Premium beauty product presentation.`,
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
  const fmt = FORMAT_CONFIGS[data.format];
  const orientation = fmt.height > fmt.width ? "vertical (portrait)" : fmt.height < fmt.width ? "horizontal (landscape)" : "square";

  let prompt = `You are an expert Arabic graphic designer creating a professional social media marketing poster for MENA audiences.

Generate a SINGLE high-quality poster IMAGE (${fmt.width}x${fmt.height} pixels, ${fmt.aspectRatio} ${orientation} format).

${orientation === "vertical (portrait)" ? `## Layout Guidance for Vertical Format
- Stack elements vertically: headline at top, hero product in center, price/CTA at bottom
- Use the full vertical space — avoid cramping content into the center
- Text should be large and readable even on mobile screens
` : orientation === "horizontal (landscape)" ? `## Layout Guidance for Horizontal Format
- Use a side-by-side layout: product on one side, text/details on the other
- Or use a cinematic wide composition with text overlay
- Ensure text is large enough to read at small sizes (social media thumbnails)
` : ""}${CATEGORY_STYLES[data.category]}
${CAMPAIGN_STYLE_GUIDANCE[data.campaignType] ? `\n${CAMPAIGN_STYLE_GUIDANCE[data.campaignType]}\n` : `\nIMPORTANT: This is a STANDARD (non-seasonal) campaign. Do NOT use any religious, seasonal, or holiday motifs. Specifically:
- No Ramadan elements: no crescents, no lanterns, no Islamic arches, no mosque silhouettes, no arabesque patterns
- No Eid elements: no festive confetti, no starbursts
- No seasonal greetings like "رمضان كريم" or "رمضان مبارك" or "كل عام وانتم بخير"
- Keep the design modern, commercial, and seasonally neutral
- If reference images contain seasonal motifs, IGNORE those motifs and match only their general layout quality and composition
`}
## Design Requirements
- ALL text in the poster MUST be in Arabic
- RTL direction for all Arabic text
- Headlines and prices: LARGE and bold (think billboard)
- Limit palette to 3-4 colors (plus white/black)
- Strong visual hierarchy: hero element > price > CTA > details
- Professional studio-quality composition

## Product & Logo Image Rules (CRITICAL)
- Feature the provided product/meal image prominently as the hero element
- Do NOT modify, redraw, stylize, or artistically reinterpret the product/meal image — use it EXACTLY as provided
- Do NOT add objects, ingredients, toppings, or decorations that are not present in the original product image
- Maintain the product's original shape, colors, proportions, and material appearance
- The product should look like a real photograph placed into a designed poster, not a re-illustrated version
- Include the provided business logo EXACTLY as given — do NOT redraw, restyle, or add text to the logo

## Layout Structure
- Top: business name + post type
- Center: product/service name + description
- Right/Left: new price + old price/discount
- Bottom: offer duration + CTA + WhatsApp

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
  const campaignLine =
    data.campaignType !== "standard"
      ? `- Campaign Type: ${data.campaignType}`
      : "";

  switch (data.category) {
    case "restaurant":
      return `Create a professional poster image for this restaurant offer:
- Restaurant Name: ${data.restaurantName}
- Post Type: ${data.postType}
- Meal Name: ${data.mealName}
${data.description ? `- Description: ${data.description}` : ""}
- New Price: ${data.newPrice}
- Old Price: ${data.oldPrice}
${data.offerBadge ? `- Offer Badge: ${data.offerBadge}` : ""}
${data.deliveryType ? `- Delivery Type: ${data.deliveryType === "free" ? "مجاني (Free)" : "مدفوع (Paid)"}` : ""}
${data.deliveryTime ? `- Delivery Time: ${data.deliveryTime}` : ""}
${data.coverageAreas ? `- Coverage Areas: ${data.coverageAreas}` : ""}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${campaignLine}

The meal photo and restaurant logo are provided as images in this message.`;

    case "supermarket":
      return `Create a professional poster image for this supermarket offer:
- Supermarket Name: ${data.supermarketName}
- Post Type: ${data.postType}
- Product Name: ${data.productName}
${data.quantity ? `- Quantity: ${data.quantity}` : ""}
- New Price: ${data.newPrice}
- Old Price: ${data.oldPrice}
${data.discountPercentage ? `- Discount Percentage: ${data.discountPercentage}%` : ""}
${data.offerLimit ? `- Offer Limit: ${data.offerLimit}` : ""}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
${data.expiryDate ? `- Expiry Date: ${data.expiryDate}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${campaignLine}

The product photo and supermarket logo are provided as images in this message.`;

    case "ecommerce":
      return `Create a professional poster image for this e-commerce store product:
- Shop Name: ${data.shopName}
- Post Type: ${data.postType}
- Product Name: ${data.productName}
${data.features ? `- Features: ${data.features}` : ""}
- New Price: ${data.newPrice}
- Old Price: ${data.oldPrice}
${data.colorSize ? `- Color/Size: ${data.colorSize}` : ""}
- Availability: ${data.availability}
${data.shippingDuration ? `- Shipping Duration: ${data.shippingDuration}` : ""}
${data.purchaseLink ? `- Purchase Link: ${data.purchaseLink}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${campaignLine}

The product photo and shop logo are provided as images in this message.`;

    case "services":
      return `Create a professional poster image for this service offer:
- Business Name: ${data.businessName}
- Service Type: ${data.serviceType}
- Service Name: ${data.serviceName}
${data.serviceDetails ? `- Service Details: ${data.serviceDetails}` : ""}
- Price: ${data.price}
- Price Type: ${data.priceType === "fixed" ? "سعر ثابت (Fixed)" : "يبدأ من (Starting from)"}
${data.executionTime ? `- Execution Time: ${data.executionTime}` : ""}
${data.coverageArea ? `- Coverage Area: ${data.coverageArea}` : ""}
${data.warranty ? `- Warranty: ${data.warranty}` : ""}
${data.quickFeatures ? `- Quick Features: ${data.quickFeatures}` : ""}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${campaignLine}

The service image and business logo are provided as images in this message.`;

    case "fashion":
      return `Create a professional poster image for this fashion brand:
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
${campaignLine}

The product photo and brand logo are provided as images in this message.`;

    case "beauty":
      return `Create a professional poster image for this beauty/salon offer:
- Salon Name: ${data.salonName}
- Post Type: ${data.postType}
- Service/Product Name: ${data.serviceName}
${data.benefit ? `- Benefit: ${data.benefit}` : ""}
- New Price: ${data.newPrice}
- Old Price: ${data.oldPrice}
${data.sessionDuration ? `- Session Duration: ${data.sessionDuration}` : ""}
${data.suitableFor ? `- Suitable For: ${data.suitableFor}` : ""}
- Booking: ${data.bookingCondition === "advance" ? "حجز مسبق (Advance booking)" : "متاح الآن (Available now)"}
${data.offerDuration ? `- Offer Duration: ${data.offerDuration}` : ""}
- WhatsApp: ${data.whatsapp}
- CTA: ${data.cta}
${campaignLine}

The service/product image and salon logo are provided as images in this message.`;
  }
}

// ── Gift Image Prompt (visual-only, no text) ─────────────────────

const GIFT_CATEGORY_VIBES: Record<Category, string> = {
  restaurant: `warm, appetizing tones — rich reds, golden amber, terracotta. Food photography style lighting with soft bokeh and steam effects.`,
  supermarket: `fresh, vibrant tones — lush greens, bright reds, sunny yellows. Clean retail aesthetic with dynamic composition and fresh produce feel.`,
  ecommerce: `modern, sleek tones — deep teals, soft gradients, metallic accents. E-commerce style with elegant lighting and premium product presentation.`,
  services: `professional, trust-building tones — clean blues, structured whites, subtle gold accents. Corporate style lighting with clean geometric backgrounds.`,
  fashion: `elegant editorial tones — soft blacks, blush pinks, rose gold accents. Fashion photography style with dramatic lighting and fabric textures.`,
  beauty: `soft, spa-like tones — warm pinks, lilacs, gold shimmer. Dreamy bokeh effects, soft glowing lighting, premium beauty product presentation.`,
};

export function getGiftImageSystemPrompt(data: PostFormData): string {
  const fmt = FORMAT_CONFIGS[data.format];

  return `You are an expert visual designer creating a beautiful promotional image.

CRITICAL RULES — follow these EXACTLY:
1. Generate ABSOLUTELY NO TEXT of any kind — no Arabic, no English, no numbers, no watermarks, no labels, no prices, no letters
2. The business logo image is provided — include it in the design EXACTLY as given. Do NOT modify, redraw, stylize, or add text to the logo
3. Feature the product/meal image as the hero visual element
4. Do NOT introduce unrelated objects, extra products, people, animals, buildings, food items, or icons that are not present in the provided product image
5. Keep the composition tightly anchored to the provided product and logo; use only supportive abstract decoration
6. Create a stunning visual composition using ONLY:
   - The product photo (prominent, hero placement)
   - The logo (placed naturally, unmodified)
   - Abstract visual elements: gradients, light rays, bokeh circles, geometric patterns, flowing shapes
   - Color harmony and professional lighting effects
   - Subtle decorative elements: sparkles, glow effects, color splashes
7. Maintain the product's original shape, color identity, and material details; no major transformation of the product itself

Visual mood: ${GIFT_CATEGORY_VIBES[data.category]}

Output: A single ${fmt.width}x${fmt.height} (${fmt.aspectRatio}) image. Pure visual art — zero text.`;
}

export function getGiftImageUserMessage(data: PostFormData): string {
  return `Create a visually stunning promotional image with NO TEXT whatsoever.

The first image is the product/meal — make it the hero of the composition.
The second image is the business logo — place it naturally in the design WITHOUT any modification.

Do not add unrelated objects or extra products. Keep the scene centered around the provided product only.
Use beautiful visual elements: abstract shapes, gradient overlays, light effects, bokeh, and color harmony. Make it look premium and eye-catching.

Remember: ZERO text, ZERO numbers, ZERO letters. Only visuals.`;
}

// ── Marketing Content Prompts ─────────────────────────────────────

function getBusinessNameFromData(data: PostFormData): string {
  switch (data.category) {
    case "restaurant": return data.restaurantName;
    case "supermarket": return data.supermarketName;
    case "ecommerce": return data.shopName;
    case "services": return data.businessName;
    case "fashion": return data.brandName;
    case "beauty": return data.salonName;
  }
}

function getProductNameFromData(data: PostFormData): string {
  switch (data.category) {
    case "restaurant": return data.mealName;
    case "supermarket": return data.productName;
    case "ecommerce": return data.productName;
    case "services": return data.serviceName;
    case "fashion": return data.itemName;
    case "beauty": return data.serviceName;
  }
}

export function getMarketingContentSystemPrompt(): string {
  return `You are an expert Arabic social media marketer specializing in MENA region businesses.

You will receive:
1. A generated marketing poster image — analyze its visual style, colors, mood, and energy
2. Business and product details

Your task: Generate engaging Arabic social media marketing content that matches the poster's visual energy and style.

RULES:
- ALL text output MUST be in Arabic
- The caption should be engaging, professional, and match the poster's mood (3-5 lines)
- Include relevant emojis naturally within the caption and story text
- Hashtags should be a mix of Arabic and transliterated English (common in MENA social media), 8-12 hashtags
- Story text should be extremely short and punchy (1-2 lines max), suitable for Instagram/WhatsApp stories
- Do NOT include any markdown formatting, bullet points, or special characters beyond standard Arabic text and emojis
- Keep the tone commercial but professional — trustworthy and engaging
- If there is a price or discount, highlight it in the caption
- Include a call-to-action naturally in the caption

OUTPUT FORMAT (strict JSON only):
{
  "caption": "the full post caption text here",
  "hashtags": ["tag1", "tag2", "tag3"],
  "storyText": "short punchy story text here"
}

Return ONLY the JSON object. No explanation, no markdown fences, no extra text.`;
}

export function getMarketingContentUserMessage(data: PostFormData): string {
  const businessName = getBusinessNameFromData(data);
  const productName = getProductNameFromData(data);
  const campaignLine = data.campaignType !== "standard" ? `- Campaign: ${data.campaignType}\n` : "";

  let details = `Generate Arabic social media marketing content for:\n`;
  details += `- Business: ${businessName}\n`;
  details += `- Product/Service: ${productName}\n`;
  details += `- Category: ${data.category}\n`;

  switch (data.category) {
    case "restaurant":
      if (data.description) details += `- Description: ${data.description}\n`;
      details += `- New Price: ${data.newPrice}\n`;
      details += `- Old Price: ${data.oldPrice}\n`;
      if (data.offerBadge) details += `- Offer Type: ${data.offerBadge}\n`;
      if (data.deliveryType) details += `- Delivery: ${data.deliveryType === "free" ? "Free" : "Paid"}\n`;
      if (data.deliveryTime) details += `- Delivery Time: ${data.deliveryTime}\n`;
      if (data.offerDuration) details += `- Offer Duration: ${data.offerDuration}\n`;
      break;
    case "supermarket":
      details += `- New Price: ${data.newPrice}\n`;
      details += `- Old Price: ${data.oldPrice}\n`;
      if (data.discountPercentage) details += `- Discount: ${data.discountPercentage}%\n`;
      if (data.offerDuration) details += `- Offer Duration: ${data.offerDuration}\n`;
      break;
    case "ecommerce":
      if (data.features) details += `- Features: ${data.features}\n`;
      details += `- New Price: ${data.newPrice}\n`;
      details += `- Old Price: ${data.oldPrice}\n`;
      details += `- Availability: ${data.availability}\n`;
      if (data.shippingDuration) details += `- Shipping: ${data.shippingDuration}\n`;
      break;
    case "services":
      if (data.serviceDetails) details += `- Details: ${data.serviceDetails}\n`;
      details += `- Price: ${data.price}\n`;
      if (data.quickFeatures) details += `- Features: ${data.quickFeatures}\n`;
      if (data.executionTime) details += `- Execution Time: ${data.executionTime}\n`;
      break;
    case "fashion":
      if (data.description) details += `- Description: ${data.description}\n`;
      details += `- New Price: ${data.newPrice}\n`;
      details += `- Old Price: ${data.oldPrice}\n`;
      if (data.availableSizes) details += `- Sizes: ${data.availableSizes}\n`;
      if (data.availableColors) details += `- Colors: ${data.availableColors}\n`;
      break;
    case "beauty":
      if (data.benefit) details += `- Benefit: ${data.benefit}\n`;
      details += `- New Price: ${data.newPrice}\n`;
      details += `- Old Price: ${data.oldPrice}\n`;
      if (data.sessionDuration) details += `- Duration: ${data.sessionDuration}\n`;
      break;
  }

  details += campaignLine;
  details += `- CTA: ${data.cta}\n`;
  details += `- WhatsApp: ${data.whatsapp}\n`;
  details += `\nThe attached image is the generated marketing poster. Match your text style to its visual mood, energy, and color palette.`;

  return details;
}
