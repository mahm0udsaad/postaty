import type { MenuCategory, CampaignType } from "./types";

// ── Menu Design Recipe Type ──────────────────────────────────────

export interface MenuDesignRecipe {
  id: string;
  name: string;
  menuCategory: MenuCategory;
  directive: string;
  campaignModifiers: Partial<Record<CampaignType, string>>;
}

// ── Restaurant Menu Recipes ──────────────────────────────────────

const RESTAURANT_MENU_RECIPES: MenuDesignRecipe[] = [
  {
    id: "rm-classic-grid",
    name: "Classic Grid Menu",
    menuCategory: "restaurant",
    directive: `Concept: Clean A4 menu layout with a warm, appetizing color scheme. Header with restaurant name and logo prominently displayed. Items arranged in a 2-column or 3-column grid. Each item gets a generous photo section with name below and price in a bold badge.
Creative hook: Use warm wood-texture or dark gradient backgrounds. Each item card has subtle rounded borders and a soft shadow. Price tags use a contrasting warm color (gold or red).
Mood: Professional, appetizing, classic restaurant menu.`,
    campaignModifiers: {
      ramadan: `Deep navy background with gold accents. Subtle crescent moon watermark in the header. Gold price badges.`,
      eid: `Warm gold background accents. Small festive sparkle elements. Celebratory but elegant.`,
    },
  },
  {
    id: "rm-modern-minimal",
    name: "Modern Minimal Menu",
    menuCategory: "restaurant",
    directive: `Concept: Clean, modern A4 menu with generous white space. Light background (off-white or very light cream). Items displayed in a clean grid with circular or rounded-square food photos. Minimal typography with a single accent color.
Creative hook: Use a single bold accent color for prices and the header strip. Food photos should float on the clean background with subtle drop shadows. Modern sans-serif typography.
Mood: Trendy, minimal, cafe-style elegance.`,
    campaignModifiers: {
      ramadan: `Soft cream background with deep green accent. Minimal geometric arabesque dividers.`,
    },
  },
  {
    id: "rm-bold-promo",
    name: "Bold Promo Menu",
    menuCategory: "restaurant",
    directive: `Concept: Energetic promotional menu with bold colors and dynamic layout. Large headline banner at top ("Our Menu" or equivalent). Items arranged in a visually dynamic grid with varying sizes. Bold price callouts with starburst or badge shapes.
Creative hook: Use a vibrant red or orange gradient background. Items have white card overlays. Prices are in large, attention-grabbing fonts with decorative elements (stars, circles). Diagonal accent shapes add energy.
Mood: Bold, energetic, street-food promotion.`,
    campaignModifiers: {
      ramadan: `Shift to navy-to-purple gradient. Gold starburst price badges. Crescent moon accent.`,
    },
  },
  {
    id: "rm-elegant-dark",
    name: "Elegant Dark Menu",
    menuCategory: "restaurant",
    directive: `Concept: Premium dark-themed A4 menu. Dark background (charcoal or deep navy). Items displayed with dramatic lighting, each photo framed in subtle gold or white borders. Elegant serif or display typography for headers.
Creative hook: Use gold or copper accent colors. Food photos should look dramatically lit against the dark background. Thin decorative lines separate sections. A premium, upscale feel.
Mood: Premium, upscale, fine dining.`,
    campaignModifiers: {
      ramadan: `Add subtle geometric Islamic pattern overlay at very low opacity. Gold text and accents.`,
    },
  },
];

// ── Supermarket Flyer Recipes ────────────────────────────────────

const SUPERMARKET_MENU_RECIPES: MenuDesignRecipe[] = [
  {
    id: "sm-super-sale",
    name: "Super Sale Flyer",
    menuCategory: "supermarket",
    directive: `Concept: Bold retail product flyer. Large store name headline at the top with eye-catching graphics. Products arranged in a grid with prominent price tags. Each product has a circular or rectangular frame with the price in a bold red or yellow badge.
Creative hook: Use a bright, energetic color scheme (red, yellow, white). Price tags should be the most prominent element. Add diagonal banner strips, dotted borders, or zigzag edges for retail energy.
Mood: Energetic, retail, eye-catching product catalog. Only show discount/sale elements if old prices are provided by the user.`,
    campaignModifiers: {
      ramadan: `Add "Ramadan Offers" header in gold. Navy background with lantern motifs. Keep bold pricing.`,
    },
  },
  {
    id: "sm-fresh-deals",
    name: "Fresh Deals Catalog",
    menuCategory: "supermarket",
    directive: `Concept: Clean grocery catalog with fresh, natural feel. Light green or white background. Products displayed in an organized grid with clean white cards. Prices in green or red badges. Fresh leaf or produce decorative accents.
Creative hook: Use green accents for a fresh, healthy feel. Product photos on clean white backgrounds within cards. Prices are prominent but not overwhelming. Subtle produce-themed decorative elements (leaves, fresh drops).
Mood: Fresh, clean, trustworthy grocery.`,
    campaignModifiers: {
      ramadan: `Warm gold and green palette. Crescent moon badge near header. Calm but promotional.`,
    },
  },
  {
    id: "sm-weekly-offers",
    name: "Weekly Offers Flyer",
    menuCategory: "supermarket",
    directive: `Concept: Classic product showcase flyer layout. Header with store name prominently displayed. Products in a structured 2x3 or 3x2 grid. Each product has a dedicated card with photo, name, and price clearly displayed.
Creative hook: Use a gradient background (warm red to orange or blue to cyan). Product cards are white with rounded corners. Prices are bold and prominent. Clean, organized layout with consistent card styling.
Mood: Professional, organized, value-focused. Only show crossed-out old prices if the user provided them.`,
    campaignModifiers: {
      ramadan: `Deep purple-to-gold gradient. "Ramadan Specials" badge. Lantern silhouettes in header.`,
    },
  },
  {
    id: "sm-premium-catalog",
    name: "Premium Product Catalog",
    menuCategory: "supermarket",
    directive: `Concept: Upscale product catalog feel. Clean dark or neutral background. Products displayed with premium presentation — each with generous spacing and professional lighting. Prices in elegant pill-shaped badges.
Creative hook: Dark gradient background with products in clean white or transparent cards. Gold or silver accent colors. Typography is clean and modern. Feels more like a product catalog than a sale flyer.
Mood: Premium, curated, quality-focused.`,
    campaignModifiers: {},
  },
];

// ── All recipes combined ─────────────────────────────────────────

const ALL_MENU_RECIPES: MenuDesignRecipe[] = [
  ...RESTAURANT_MENU_RECIPES,
  ...SUPERMARKET_MENU_RECIPES,
];

// ── Selection & Formatting ───────────────────────────────────────

const SEASONAL_RECIPE_IDS = new Set(["rm-elegant-dark"]);

export function selectMenuRecipes(
  menuCategory: MenuCategory,
  count: number = 1,
  campaignType: CampaignType = "standard"
): MenuDesignRecipe[] {
  let pool = ALL_MENU_RECIPES.filter((r) => r.menuCategory === menuCategory);

  // Exclude inherently seasonal recipes for standard campaigns
  if (campaignType === "standard") {
    pool = pool.filter((r) => !SEASONAL_RECIPE_IDS.has(r.id));
  }

  if (pool.length === 0) return [];

  // Fisher-Yates shuffle
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function formatMenuRecipeForPrompt(
  recipe: MenuDesignRecipe,
  campaignType: CampaignType = "standard"
): string {
  let prompt = `## Design Direction: "${recipe.name}"\n${recipe.directive}`;

  if (campaignType !== "standard" && recipe.campaignModifiers[campaignType]) {
    prompt += `\n\n### Campaign Modifier (${campaignType}):\n${recipe.campaignModifiers[campaignType]}`;
  }

  return prompt;
}
