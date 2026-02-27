import { FORMAT_CONFIGS } from "./constants";
import type { PostFormData, Category, CampaignType } from "./types";
import type { BrandKitPromptData } from "./prompts";
import type { ResolvedLanguage } from "./resolved-language";

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
  resolvedLanguage: ResolvedLanguage,
  brandKit?: BrandKitPromptData
): string {
  const fmt = FORMAT_CONFIGS[data.format];
  const orientation = fmt.height > fmt.width ? "vertical (portrait)" : fmt.height < fmt.width ? "horizontal (landscape)" : "square";

  let prompt = `You are an expert graphic designer creating a professional social media marketing poster.

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
## Language & Text Direction (CRITICAL)
- The resolved target language for this poster is: ${resolvedLanguage === "ar" ? "Arabic" : resolvedLanguage === "he" ? "Hebrew" : "English"}
- ALL text on the poster MUST be in this target language only
- Do NOT mix languages under any circumstance
- For Arabic/Hebrew: use RTL text direction
- For English: use LTR text direction

## Design Requirements
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
${data.deliveryType ? `- Delivery Type: ${data.deliveryType === "free" ? "Free" : "Paid"}` : ""}
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
- Price Type: ${data.priceType === "fixed" ? "Fixed price" : "Starting from"}
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
- Booking: ${data.bookingCondition === "advance" ? "Advance booking" : "Available now"}
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

// ── Shared Helpers ─────────────────────────────────────────────────

export function getBusinessNameFromForm(data: PostFormData): string {
  switch (data.category) {
    case "restaurant": return data.restaurantName;
    case "supermarket": return data.supermarketName;
    case "ecommerce": return data.shopName;
    case "services": return data.businessName;
    case "fashion": return data.brandName;
    case "beauty": return data.salonName;
  }
}

export function getProductNameFromForm(data: PostFormData): string {
  switch (data.category) {
    case "restaurant": return data.mealName;
    case "supermarket": return data.productName;
    case "ecommerce": return data.productName;
    case "services": return data.serviceName;
    case "fashion": return data.itemName;
    case "beauty": return data.serviceName;
  }
}

// ── Marketing Content Hub Prompts ──────────────────────────────────

const CATEGORY_LABELS_MAP: Record<Category, { ar: string; en: string }> = {
  restaurant: { ar: "مطاعم وكافيهات", en: "Restaurants & Cafes" },
  supermarket: { ar: "سوبر ماركت", en: "Supermarkets" },
  ecommerce: { ar: "متاجر إلكترونية", en: "E-commerce" },
  services: { ar: "خدمات", en: "Services" },
  fashion: { ar: "أزياء وموضة", en: "Fashion" },
  beauty: { ar: "تجميل وعناية", en: "Beauty & Care" },
};

export function buildMarketingContentSystemPrompt(
  data: PostFormData,
  language: string
): string {
  const langInstruction = language === "auto"
    ? "CRITICAL: Detect the language of the user's input (business name, product name, description, CTA, etc.) and generate ALL output text in that SAME language. Do NOT default to Arabic or English — match the user's input language exactly. Hashtags can mix the detected language with English."
    : language === "ar"
    ? "CRITICAL: ALL output text MUST be in Arabic. Hashtags can mix Arabic and English."
    : language === "en"
    ? "CRITICAL: ALL output text MUST be in English. Hashtags should be in English."
    : `CRITICAL: ALL output text MUST be in the same language as the user's input. Hashtags can mix with English.`;

  return `You are an expert social media marketing strategist specializing in MENA region businesses.

${langInstruction}

Your task: Generate optimized marketing content for 4 social media platforms (Facebook, Instagram, WhatsApp, TikTok) based on the business and product information provided.

Use Google Search to find:
1. Current best posting times for each platform in the MENA/Arab region (${new Date().getFullYear()})
2. Platform-specific content strategies and character limits
3. Trending hashtags relevant to the business category
4. Current engagement best practices per platform

REQUIREMENTS PER PLATFORM:

**Facebook:**
- Caption: 1-3 paragraphs, storytelling approach, can be longer
- Include a clear CTA
- 3-5 relevant hashtags (mix of broad and niche)
- Best posting time specific to MENA region

**Instagram:**
- Caption: Engaging, emoji-rich, formatted with line breaks
- Start with a hook (first line visible before "more")
- 15-25 hashtags (mix of popular, medium, and niche)
- Best posting time specific to MENA region

**WhatsApp:**
- Caption: Short, direct, conversational (like a message to a friend/customer)
- Include price and offer details prominently
- 0-3 hashtags (WhatsApp captions are often shared without hashtags)
- Best time to send broadcast messages

**TikTok:**
- Caption: Very short, trendy, with hook
- Use trending sounds/challenge references if applicable
- 5-10 hashtags (trending + niche)
- Best posting time for maximum reach

For bestPostingTime: provide specific days and time ranges.
For bestPostingTimeReason: explain WHY this time works (1 sentence).
For contentTip: give ONE actionable tip specific to this platform and this business category.`;
}

export function buildMarketingContentUserMessage(
  data: PostFormData,
  language: string
): string {
  const businessName = getBusinessNameFromForm(data);
  const productName = getProductNameFromForm(data);
  const categoryLabel = language === "ar"
    ? CATEGORY_LABELS_MAP[data.category].ar
    : CATEGORY_LABELS_MAP[data.category].en;

  let details = `Business: ${businessName}
Category: ${categoryLabel}
Product/Service: ${productName}`;

  if ("newPrice" in data && data.newPrice) details += `\nPrice: ${data.newPrice}`;
  if ("oldPrice" in data && data.oldPrice) details += `\nOriginal Price: ${data.oldPrice}`;
  if ("price" in data && data.price) details += `\nPrice: ${data.price}`;
  if ("offerDuration" in data && data.offerDuration) details += `\nOffer Duration: ${data.offerDuration}`;

  details += `\nCTA: ${data.cta}`;
  details += `\nWhatsApp: ${data.whatsapp}`;

  if (data.category === "restaurant" && data.description) {
    details += `\nDescription: ${data.description}`;
  }
  if (data.category === "ecommerce" && data.features) {
    details += `\nFeatures: ${data.features}`;
  }

  const lang = language === "auto" ? "the same language as the user's input below" : language === "ar" ? "Arabic" : language === "en" ? "English" : "the same language as the user's input below";

  return `Generate optimized marketing captions in ${lang} for all 4 platforms for this business:

${details}

Use web search to find the latest best practices, posting times, and trending hashtags for the "${data.category}" category in the MENA/Arab region. Make the content compelling, platform-native, and optimized for engagement.`;
}
