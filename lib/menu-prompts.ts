import { MENU_FORMAT_CONFIG } from "./constants";
import type { MenuFormData, MenuCategory, CampaignType } from "./types";
import type { BrandKitPromptData } from "./prompts";

// ── Menu Category Style Guidance ─────────────────────────────────

const MENU_CATEGORY_STYLES: Record<MenuCategory, string> = {
  restaurant: `Category: Restaurant / Cafe Menu
Color palette: warm appetizing tones — deep reds, golds, cream, warm browns, or dark wood textures.
Style: Professional menu layout. Each item gets a dedicated section with its photo prominently displayed alongside name and price.
Layout inspiration: Think restaurant menu boards, cafe chalkboard menus, or printed menu cards.
Products should look appetizing and well-presented.`,

  supermarket: `Category: Supermarket Product Catalog / Flyer
Color palette: energetic retail — bright reds, yellows, greens on white or cream backgrounds.
Style: Bold product catalog with prominent price tags and eye-catching borders.
Layout inspiration: Think grocery store product catalogs, organized product displays.
Products should be clear and identifiable with prices as the focal point.
IMPORTANT: Do NOT add sale/offer/discount elements unless the user explicitly provided old prices.`,
};

const MENU_CAMPAIGN_GUIDANCE: Record<CampaignType, string> = {
  standard: "",
  ramadan: `Campaign: Ramadan special (MENA)
Palette: deep indigo/navy, warm gold, emerald accents, soft cream.
Motifs: subtle crescent moon, lantern, or geometric arabesque pattern (very low opacity).
Tone: calm, premium, spiritual yet modern. Keep the layout clean.`,
  eid: `Campaign: Eid offer (MENA)
Palette: warm gold, celebratory green, clean neutrals.
Motifs: minimal sparkles, starbursts, confetti dots (small and tasteful).
Tone: joyful, premium, modern.`,
};

// ── Menu System Prompt ───────────────────────────────────────────

export function getMenuSystemPrompt(
  data: MenuFormData,
  brandKit?: BrandKitPromptData
): string {
  const fmt = MENU_FORMAT_CONFIG;

  let prompt = `You are an expert graphic designer creating a professional A4 menu/catalog flyer.

Generate a SINGLE high-quality A4 portrait menu image (${fmt.width}x${fmt.height} pixels).

## CRITICAL: This is a MULTI-ITEM MENU/CATALOG — NOT a single-product poster
- You will receive ${data.items.length} product/item images, each with a name and price
- You MUST display ALL ${data.items.length} items on the page
- Each item MUST show: its product photo, its name, and its price
- Do NOT omit any item — every single one must appear

## Layout Structure (A4 Portrait)
- **Top section**: Business name + logo prominently displayed
- **Main section**: All items arranged in an organized grid (2-column or 3-column layout)
  - Each item gets: product photo (prominent) + name (clear text) + price (bold, visible)
  - Items should have equal visual weight — no item should dominate over others
- **Bottom section**: WhatsApp contact number (no invented CTA or tagline text)

## Product Image Rules (CRITICAL)
- Display each product image EXACTLY as provided — do NOT redraw, stylize, or artistically reinterpret any product
- Do NOT add objects, ingredients, or decorations not present in the original product images
- Maintain each product's original shape, colors, and proportions
- Products should look like real photographs placed into a designed layout
- Do NOT draw or recreate any logo yourself

${MENU_CATEGORY_STYLES[data.menuCategory]}
${MENU_CAMPAIGN_GUIDANCE[data.campaignType] ? `\n${MENU_CAMPAIGN_GUIDANCE[data.campaignType]}\n` : `\nIMPORTANT: This is a STANDARD (non-seasonal) campaign. Do NOT use any religious, seasonal, or holiday motifs.
- No Ramadan elements: no crescents, no lanterns, no Islamic arches
- No Eid elements: no festive confetti, no starbursts
- Keep the design modern, commercial, and seasonally neutral
`}
## Language & Text Direction (CRITICAL)
- Detect the language of the user-provided text (business name, item names, prices, etc.)
- ALL text on the menu MUST be in the SAME language as the user's input
- Do NOT mix languages
- For RTL languages (Arabic, Hebrew): use RTL text direction
- For LTR languages (English, French, Turkish, etc.): use LTR text direction

## CRITICAL: You are a LAYOUT ENGINE — Do NOT Invent Any Text Content
- You are a LAYOUT ENGINE, not a copywriter. Your job is to PLACE the given text strings on the menu — NEVER write or create text yourself
- Treat each text string as a pre-rendered label you paste into the design
- Display ONLY the exact text the user gave you: business name, item names, prices, WhatsApp number, and address
- Do NOT invent, add, or generate ANY text that the user did not provide, including:
  - Headlines or titles (e.g. "Weekly Offers", "Our Menu", "عروض الأسبوع", "قائمة الطعام")
  - Promotional text (e.g. "Sale", "Limited Time", "خصم", "عرض ساخن")
  - Taglines or slogans (e.g. "The Best Spices", "Order Now", "اطلب الآن")
  - Old/crossed-out prices or discount percentages — ONLY show if the user explicitly provided an old price
  - CTA phrases, hashtags, or any decorative text
- If no old prices are given, treat ALL prices as regular prices with clean styling — no discount formatting
- The design should be visually rich and professional using colors, shapes, borders, and layout — NOT invented text

## Design Requirements
- Fill the entire A4 page — no large empty areas
- Prices must be LARGE, bold, and easy to read
- Clear visual hierarchy: business name > item photos > prices > item names > contact
- Professional print-quality composition
- Limit palette to 3-4 colors (plus white/black)
- Each item should be clearly separated from others (cards, borders, or spacing)

## Visual References
You will receive reference menu/flyer designs. Match or exceed their professional quality while creating an original design.`;

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

// ── Menu User Message ────────────────────────────────────────────

export function getMenuUserMessage(data: MenuFormData): string {
  const itemsList = data.items
    .map((item, i) => {
      const priceStr = item.oldPrice
        ? `Price: ${item.price} (was ${item.oldPrice} — show as crossed-out original price with discount)`
        : `Price: ${item.price}`;
      return `  ${i + 1}. "${item.name}" — ${priceStr}`;
    })
    .join("\n");

  return `Create a professional A4 menu/catalog flyer for this business:

- Business Name: ${data.businessName}
- Type: ${data.menuCategory === "restaurant" ? "Restaurant / Cafe" : "Supermarket"}
- WhatsApp: ${data.whatsapp}${data.address ? `\n- Address: ${data.address}` : ""}

Items to display (${data.items.length} items total — ALL must appear on the menu):
${itemsList}

The user has uploaded:
- ${data.items.length} product/item photos (one per item, in the same order as the list above)
- The business logo

Arrange ALL items in a clean, organized grid layout. Each item must clearly show its photo, name, and price. Make the design professional and visually appealing.

REMINDER: Only display the text provided above. Do NOT add any headlines, taglines, slogans, promotional text, or CTA phrases that are not in the data above.`;
}
