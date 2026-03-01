import { FORMAT_CONFIGS } from "./constants";
import type { PostFormData, Category, CampaignType } from "./types";
import type { BrandKitPromptData } from "./prompts";
import type { ResolvedLanguage } from "./resolved-language";

// ── Category Color Guidance ───────────────────────────────────────

const CATEGORY_COLOR_PALETTES: Record<Category, string> = {
  restaurant: `Color palette: warm tones — reds, terracotta, golds, cream.`,
  supermarket: `Color palette: fresh and energetic — warm reds, greens, yellows, creams.`,
  ecommerce: `Color palette: modern — deep teals, warm neutrals, bold accent color.`,
  services: `Color palette: professional tones — blues, navies, clean whites, subtle grays.`,
  fashion: `Color palette: elegant editorial tones — blush, neutrals, deep blacks, rose gold.`,
  beauty: `Color palette: soft feminine tones — pinks, golds, soft lilacs, creamy whites.`,
};

const CATEGORY_AESTHETICS: Record<Category, string> = {
  restaurant: `Category: Restaurant / مطاعم
Style: appetizing, inviting, food-focused. The meal image should be the hero element.
Make the price prominent with a bold but clean badge or pill.`,

  supermarket: `Category: Supermarket / سوبر ماركت
Style: clean retail aesthetic, bold price tags, discount badges.
Multiple products can be displayed. Headline should be prominent.`,

  ecommerce: `Category: E-Commerce / متجر إلكتروني
Style: clean e-commerce aesthetic, minimalist but impactful.
Product on clean background, trust badges, shipping info visible.`,

  services: `Category: Services / خدمات
Style: corporate yet approachable, icon-driven, trust-building.
Service details as clean bullet points. Emphasize reliability and professionalism.`,

  fashion: `Category: Fashion / أزياء
Style: editorial/magazine feel, garment as hero, aspirational.
Size/color as styled badges. Luxurious and aspirational mood.`,

  beauty: `Category: Beauty / جمال وعناية
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
` : ""}${CATEGORY_AESTHETICS[data.category]}
${brandKit ? `Color palette (from Brand Kit — MUST use these colors):
- Primary: ${brandKit.palette.primary} | Secondary: ${brandKit.palette.secondary} | Accent: ${brandKit.palette.accent}
- Background: ${brandKit.palette.background} | Text: ${brandKit.palette.text}
These brand colors OVERRIDE the default category palette. Build the entire design around these colors.` : `${CATEGORY_COLOR_PALETTES[data.category]}
IMPORTANT: If a business logo is provided, EXTRACT its dominant colors and USE them as the primary palette for the poster. The design should feel like it belongs to the same brand as the logo. The category palette above is a fallback — the logo's actual colors always take priority.`}
${CAMPAIGN_STYLE_GUIDANCE[data.campaignType] ? `\n${CAMPAIGN_STYLE_GUIDANCE[data.campaignType]}\n` : `\nIMPORTANT: This is a STANDARD (non-seasonal) campaign. Do NOT use any religious, seasonal, or holiday motifs. Specifically:
- No Ramadan elements: no crescents, no lanterns, no Islamic arches, no mosque silhouettes, no arabesque patterns
- No Eid elements: no festive confetti, no starbursts
- No seasonal greetings like "رمضان كريم" or "رمضان مبارك" or "كل عام وانتم بخير"
- Keep the design modern, commercial, and seasonally neutral
- If reference images contain seasonal motifs, IGNORE those motifs and match only their general layout quality and composition
`}
## Language & Text Direction (CRITICAL)
- The resolved target language for this poster is: ${resolvedLanguage === "ar" ? "Arabic" : resolvedLanguage === "he" ? "Hebrew" : resolvedLanguage === "fr" ? "French" : resolvedLanguage === "de" ? "German" : resolvedLanguage === "tr" ? "Turkish" : resolvedLanguage === "en" ? "English" : resolvedLanguage}
- ALL text on the poster MUST be in the resolved target language
- If user-provided text is in a DIFFERENT language than the target, TRANSLATE it to the target language before rendering
- Business/brand names are proper nouns — keep them exactly as the user typed them (do NOT translate brand names)
- For Arabic/Hebrew target: use RTL text direction for the overall layout
- For all other languages: use LTR text direction for the overall layout

## Text Accuracy Rules (CRITICAL — READ CAREFULLY)
- The poster must contain ONLY the text listed in the "EXACT TEXT INVENTORY" section of the user message — NOTHING else
- Every word on the poster MUST be copied EXACTLY, character-by-character, from the inventory
- Do NOT paraphrase, abbreviate, rephrase, merge, or "improve" any user-provided text
- Do NOT invent, hallucinate, or generate ANY text that is not in the inventory
- ABSOLUTELY NO creative slogans, taglines, promotional phrases, marketing headlines, or catchy lines — if it's not in the inventory, it MUST NOT appear on the poster
- Do NOT add labels, headings, categories, or descriptive words (e.g., do NOT add "menu", "discount", "delivery", "offer", "sale", "new", "free", "special", "limited" unless they appear in the inventory)
- Do NOT add decorative Arabic/English text like "عرض خاص", "لا تفوت الفرصة", "اليوم فقط", "Don't miss out", etc. unless explicitly in the inventory
- If inventory text is in a different language than the target poster language, translate it accurately to the target language — but NEVER add extra text that isn't in the inventory
- If uncertain about a word's spelling, use the EXACT characters from the inventory — do NOT guess
- Arabic text is especially sensitive: ط≠ظ, ا≠أ≠إ, ة≠ه, ي≠ى — copy each letter precisely
- Keep ALL text LARGE and readable — no tiny footnote-style text anywhere on the poster
- Do NOT place text on curved surfaces, extreme angles, or locations that reduce readability
- The poster is a VISUAL DESIGN with ONLY the user's provided text — treat it like a template where you place exact strings

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
- Show the product/meal image EXACTLY ONCE — do NOT duplicate, mirror, or repeat the product in the composition
- Do NOT add decorative copies, reflections, or smaller thumbnails of the same product
- Do NOT generate or hallucinate any text on the product's packaging or label — preserve existing label text from the photo as-is, but add NOTHING new onto the product surface
- Include the provided business logo EXACTLY as given — do NOT redraw, restyle, or add text to the logo
- Show the logo EXACTLY ONCE — do NOT duplicate, repeat, or place multiple copies of the logo anywhere in the design
- The poster should contain ONLY: ONE hero product image, ONE logo instance, and text from the inventory — NOTHING more
- Do NOT invent or add ANY visual elements that were not provided by the user — no QR codes, no barcodes, no maps, no icons, no social media icons, no phone illustrations, no decorative badges, no stamps, no seals, no ribbons, no stickers
- The ONLY images allowed are the user's product photo and logo — everything else must be abstract design elements (gradients, shapes, color blocks, patterns)

## Layout Structure (placement hints only — do NOT render these labels as visible text)
- Top: business name
- Center: product/service name + description
- Right/Left: new price + old price/discount
- Bottom: offer duration + CTA + WhatsApp

## Visual References
You will receive reference poster designs. Match or exceed their professional quality while creating an original design.

## Things to AVOID
- No garbled, misspelled, or broken Arabic/Hebrew characters
- No text that was not explicitly provided by the user — NO invented slogans, taglines, or promotional headlines
- No duplicate product images — show the product exactly once
- No duplicate logos — show the logo exactly once
- No fictional or hallucinated text on product packaging or labels
- No tiny, unreadable text anywhere on the poster
- No mixed languages — all text in the resolved target language (except business/brand names which are proper nouns)
- No watermarks or stock photo badges
- No distorted or warped text
- No QR codes, barcodes, maps, social media icons, or any invented visual elements not provided by the user`;

  if (brandKit) {
    if (brandKit.styleAdjectives.length > 0) {
      prompt += `\n\n## Brand Style\n- Style: ${brandKit.styleAdjectives.join(", ")}`;
    }
    if (brandKit.doRules.length > 0 || brandKit.dontRules.length > 0) {
      prompt += `\n\n## Brand Rules (MUST follow)`;
      if (brandKit.doRules.length > 0) {
        prompt += `\n- DO: ${brandKit.doRules.join("; ")}`;
      }
      if (brandKit.dontRules.length > 0) {
        prompt += `\n- DON'T: ${brandKit.dontRules.join("; ")}`;
      }
    }
  }

  return prompt;
}

// ── CTA / Dropdown Translation ─────────────────────────────────────

const CTA_TRANSLATIONS: Record<string, string> = {
  // Restaurant
  "اطلب الان واستفيد من العرض": "Order now and save",
  "اطلب قبل انتهاء العرض": "Order before offer ends",
  "توصيل سريع": "Fast delivery",
  // Supermarket
  "اطلب الان": "Order now",
  "أضف للسلة عبر الواتساب": "Add to cart on WhatsApp",
  "العرض ساري اليوم": "Offer valid today",
  // Ecommerce
  "اشترِ الآن": "Buy now",
  "تسوق الآن": "Shop now",
  "شاهد التفاصيل": "View details",
  // Services
  "احجز الآن": "Book now",
  "اطلب زيارة": "Request visit",
  "استشارة واتساب": "WhatsApp consultation",
  // Fashion
  "اطلب الآن": "Order now",
  "اطلبها عبر الواتساب": "Order via WhatsApp",
  // Beauty
  "احجزي الآن": "Book now",
  "احجز عبر الواتساب": "Reserve via WhatsApp",
  "استفيدي من العرض": "Claim offer",
};

const OFFER_BADGE_TRANSLATIONS: Record<string, Record<string, string>> = {
  discount: { ar: "خصم", en: "Discount", fr: "Remise", de: "Rabatt", tr: "İndirim" },
  new: { ar: "جديد", en: "New", fr: "Nouveau", de: "Neu", tr: "Yeni" },
  bestseller: { ar: "الأكثر مبيعاً", en: "Best Seller", fr: "Best-seller", de: "Bestseller", tr: "Çok Satan" },
};

const DELIVERY_TRANSLATIONS: Record<string, Record<string, string>> = {
  free: { ar: "توصيل مجاني", en: "Free Delivery", fr: "Livraison gratuite", de: "Kostenlose Lieferung", tr: "Ücretsiz Teslimat" },
  paid: { ar: "توصيل مدفوع", en: "Paid Delivery", fr: "Livraison payante", de: "Kostenpflichtige Lieferung", tr: "Ücretli Teslimat" },
};

function translateCta(cta: string, posterLanguage: string): string {
  if (posterLanguage === "ar") return cta; // Already Arabic
  // If cta is Arabic and poster language is not, translate it
  const translation = CTA_TRANSLATIONS[cta];
  return translation || cta;
}

function translateBadge(badge: string, posterLanguage: string): string {
  const lang = posterLanguage === "ar" ? "ar" : posterLanguage === "fr" ? "fr" : posterLanguage === "de" ? "de" : posterLanguage === "tr" ? "tr" : "en";
  return OFFER_BADGE_TRANSLATIONS[badge]?.[lang] || badge;
}

function translateDelivery(type: string, posterLanguage: string): string {
  const lang = posterLanguage === "ar" ? "ar" : posterLanguage === "fr" ? "fr" : posterLanguage === "de" ? "de" : posterLanguage === "tr" ? "tr" : "en";
  return DELIVERY_TRANSLATIONS[type]?.[lang] || type;
}

// ── Image Generation User Message ─────────────────────────────────

function langDisplayName(code: string): string {
  const map: Record<string, string> = { ar: "Arabic", en: "English", fr: "French", de: "German", tr: "Turkish", he: "Hebrew" };
  return map[code] || code;
}

export function getImageDesignUserMessage(data: PostFormData, posterLanguage?: string): string {
  const lang = posterLanguage || data.posterLanguage || "en";
  const cta = translateCta(data.cta, lang);
  const langName = langDisplayName(lang);
  const campaignLine =
    data.campaignType !== "standard"
      ? `- Campaign Type: ${data.campaignType}`
      : "";

  switch (data.category) {
    case "restaurant":
      return `Create a professional poster image for this restaurant offer.

(The following is CONTEXT ONLY for understanding the business — do NOT render these labels or field names on the poster)
Restaurant: ${data.restaurantName} | Meal: ${data.mealName} | Prices: ${data.newPrice} / ${data.oldPrice}
${data.description ? `Description: ${data.description}` : ""}
${campaignLine}

The meal photo and restaurant logo are provided as images in this message.

EXACT TEXT INVENTORY — poster language: ${langName}
Translate ALL text below to ${langName} before rendering. Only these items may appear on the poster:
- Business name: "${data.restaurantName}" (proper noun — do NOT translate)
- Product name: "${data.mealName}" → translate to ${langName}
${data.description ? `- Description: "${data.description}" → translate to ${langName}\n` : ""}- New price: "${data.newPrice}"
- Old price: "${data.oldPrice}"
${data.offerBadge ? `- Offer badge: "${translateBadge(data.offerBadge, lang)}"\n` : ""}${data.deliveryType ? `- Delivery: "${translateDelivery(data.deliveryType, lang)}"\n` : ""}${data.offerDuration ? `- Offer duration: "${data.offerDuration}" → translate to ${langName}\n` : ""}- CTA: "${cta}"
- WhatsApp: "${data.whatsapp}"
NOTHING else. No "menu", no extra labels, no decorative text.`;

    case "supermarket":
      return `Create a professional poster image for this supermarket offer.

(CONTEXT ONLY — do NOT render these labels on the poster)
Supermarket: ${data.supermarketName} | Product: ${data.productName} | Prices: ${data.newPrice} / ${data.oldPrice}
${campaignLine}

The product photo and supermarket logo are provided as images in this message.

EXACT TEXT INVENTORY — poster language: ${langName}
Translate ALL text below to ${langName} before rendering. Only these items may appear on the poster:
- Business name: "${data.supermarketName}" (proper noun — do NOT translate)
- Product name: "${data.productName}" → translate to ${langName}
- New price: "${data.newPrice}"
- Old price: "${data.oldPrice}"
${data.discountPercentage ? `- Discount: "${data.discountPercentage}%"\n` : ""}${data.offerDuration ? `- Offer duration: "${data.offerDuration}" → translate to ${langName}\n` : ""}- CTA: "${cta}"
- WhatsApp: "${data.whatsapp}"
NOTHING else. No extra labels, no decorative text.`;

    case "ecommerce":
      return `Create a professional poster image for this e-commerce product.

(CONTEXT ONLY — do NOT render these labels on the poster)
Shop: ${data.shopName} | Product: ${data.productName} | Prices: ${data.newPrice} / ${data.oldPrice}
${campaignLine}

The product photo and shop logo are provided as images in this message.

EXACT TEXT INVENTORY — poster language: ${langName}
Translate ALL text below to ${langName} before rendering. Only these items may appear on the poster:
- Business name: "${data.shopName}" (proper noun — do NOT translate)
- Product name: "${data.productName}" → translate to ${langName}
${data.features ? `- Features: "${data.features}" → translate to ${langName}\n` : ""}- New price: "${data.newPrice}"
- Old price: "${data.oldPrice}"
${data.shippingDuration ? `- Shipping: "${data.shippingDuration}" → translate to ${langName}\n` : ""}${data.purchaseLink ? `- Purchase link: "${data.purchaseLink}"\n` : ""}- CTA: "${cta}"
- WhatsApp: "${data.whatsapp}"
NOTHING else. No extra labels, no decorative text.`;

    case "services":
      return `Create a professional poster image for this service offer.

(CONTEXT ONLY — do NOT render these labels on the poster)
Business: ${data.businessName} | Service: ${data.serviceName} | Price: ${data.price}
${campaignLine}

The service image and business logo are provided as images in this message.

EXACT TEXT INVENTORY — poster language: ${langName}
Translate ALL text below to ${langName} before rendering. Only these items may appear on the poster:
- Business name: "${data.businessName}" (proper noun — do NOT translate)
- Service name: "${data.serviceName}" → translate to ${langName}
${data.serviceDetails ? `- Details: "${data.serviceDetails}" → translate to ${langName}\n` : ""}- Price: "${data.price}"
${data.executionTime ? `- Execution time: "${data.executionTime}" → translate to ${langName}\n` : ""}${data.coverageArea ? `- Coverage: "${data.coverageArea}" → translate to ${langName}\n` : ""}${data.warranty ? `- Warranty: "${data.warranty}" → translate to ${langName}\n` : ""}${data.quickFeatures ? `- Features: "${data.quickFeatures}" → translate to ${langName}\n` : ""}${data.offerDuration ? `- Offer duration: "${data.offerDuration}" → translate to ${langName}\n` : ""}- CTA: "${cta}"
- WhatsApp: "${data.whatsapp}"
NOTHING else. No extra labels, no decorative text.`;

    case "fashion":
      return `Create a professional poster image for this fashion brand.

(CONTEXT ONLY — do NOT render these labels on the poster)
Brand: ${data.brandName} | Item: ${data.itemName} | Prices: ${data.newPrice} / ${data.oldPrice}
${campaignLine}

The product photo and brand logo are provided as images in this message.

EXACT TEXT INVENTORY — poster language: ${langName}
Translate ALL text below to ${langName} before rendering. Only these items may appear on the poster:
- Brand name: "${data.brandName}" (proper noun — do NOT translate)
- Item name: "${data.itemName}" → translate to ${langName}
${data.description ? `- Description: "${data.description}" → translate to ${langName}\n` : ""}- New price: "${data.newPrice}"
- Old price: "${data.oldPrice}"
${data.availableSizes ? `- Sizes: "${data.availableSizes}" → translate to ${langName}\n` : ""}${data.availableColors ? `- Colors: "${data.availableColors}" → translate to ${langName}\n` : ""}${data.offerNote ? `- Offer note: "${data.offerNote}" → translate to ${langName}\n` : ""}- CTA: "${cta}"
- WhatsApp: "${data.whatsapp}"
NOTHING else. No extra labels, no decorative text.`;

    case "beauty":
      return `Create a professional poster image for this beauty/salon offer.

(CONTEXT ONLY — do NOT render these labels on the poster)
Salon: ${data.salonName} | Service: ${data.serviceName} | Prices: ${data.newPrice} / ${data.oldPrice}
${campaignLine}

The service/product image and salon logo are provided as images in this message.

EXACT TEXT INVENTORY — poster language: ${langName}
Translate ALL text below to ${langName} before rendering. Only these items may appear on the poster:
- Salon name: "${data.salonName}" (proper noun — do NOT translate)
- Service name: "${data.serviceName}" → translate to ${langName}
${data.benefit ? `- Benefit: "${data.benefit}" → translate to ${langName}\n` : ""}- New price: "${data.newPrice}"
- Old price: "${data.oldPrice}"
${data.sessionDuration ? `- Duration: "${data.sessionDuration}" → translate to ${langName}\n` : ""}${data.suitableFor ? `- Suitable for: "${data.suitableFor}" → translate to ${langName}\n` : ""}- CTA: "${cta}"
- WhatsApp: "${data.whatsapp}"
NOTHING else. No extra labels, no decorative text.`;
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
