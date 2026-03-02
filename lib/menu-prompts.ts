import { MENU_FORMAT_CONFIG } from "./constants";
import type { MenuFormData, MenuCategory, CampaignType } from "./types";
import type { BrandKitPromptData } from "./prompts";

// ── Dynamic Grid Layout Guidance ────────────────────────────────

function getGridLayoutGuidance(itemCount: number): string {
  if (itemCount <= 2) return `  - Use a single row with ${itemCount} columns (1×${itemCount} grid)`;
  if (itemCount === 3) return `  - Use a single row with 3 columns (1×3 grid) — exactly 3 cells, one per item`;
  if (itemCount === 4) return `  - Use a 2×2 grid (2 rows, 2 columns)`;
  if (itemCount === 5) return `  - Use a 3+2 layout (3 columns top row, 2 columns bottom row)`;
  if (itemCount === 6) return `  - Use a 2×3 grid (2 rows, 3 columns) or 3×2 grid`;
  if (itemCount === 7) return `  - Use a 3+2+2 or 3+4 layout`;
  if (itemCount === 8) return `  - Use a 2×4 grid or 3+3+2 layout`;
  return `  - Use a 3×3 grid (3 rows, 3 columns)`;
}

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
- **Main section**: All ${data.items.length} items arranged in an organized grid
${getGridLayoutGuidance(data.items.length)}
  - Each item gets: product photo (prominent) + name (clear text) + price (bold, visible)
  - Items should have equal visual weight — no item should dominate over others
- **Bottom section**: WhatsApp contact number (no invented CTA or tagline text)

## CRITICAL: Item Count = EXACTLY ${data.items.length}
- The final design MUST contain EXACTLY ${data.items.length} product cells — no more, no fewer
- NEVER duplicate any item to fill empty grid space
- NEVER invent or hallucinate extra products that were not provided
- If the grid has empty cells, shrink the grid to fit exactly ${data.items.length} items — NEVER fill an empty cell with an invented product

## Product Image Rules (CRITICAL)
- Display each product image EXACTLY as provided — do NOT redraw, stylize, or artistically reinterpret any product
- Do NOT add objects, ingredients, or decorations not present in the original product images
- Maintain each product's original shape, colors, and proportions
- Products should look like real photographs placed into a designed layout
- Use the provided business logo image EXACTLY as given (pixel-faithful), and place it exactly once
- Do NOT redraw, regenerate, restyle, recolor, crop, or rewrite any text inside the logo
- Do NOT replace the provided logo with any icon, cart symbol, or generated brand mark

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
You will receive reference menu/flyer designs for STYLE ONLY.
- Use references only to understand visual direction (layout quality, spacing, color mood, hierarchy)
- NEVER copy the reference content, product count, product names, prices, logo, or text
- NEVER replicate the same card count/grid from references unless it naturally matches the exact uploaded item count
- Your content source of truth is ONLY the uploaded item images + provided item list in this prompt
- Final design must include EXACTLY ${data.items.length} items (not more, not less), each shown once`;

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

Arrange ALL items in a clean, organized grid layout. Each item must clearly show its photo, name, and price. Make the design professional and visually appealing.

REMINDER: Only display the text provided above. Do NOT add any headlines, taglines, slogans, promotional text, or CTA phrases that are not in the data above.`;
}
