import type { Category, CampaignType } from "./types";

// ── Design Recipe Type ──────────────────────────────────────────

export interface DesignRecipe {
  id: string;
  name: string;
  category: Category;
  directive: string;
  campaignModifiers: Partial<Record<CampaignType, string>>;
}

// ── Restaurant Recipes ──────────────────────────────────────────

const RESTAURANT_RECIPES: DesignRecipe[] = [
  {
    id: "r-bold-gradient",
    name: "Bold Gradient Hero",
    category: "restaurant",
    directive: `Concept: Warm gradient background flowing from deep orange to golden yellow. Food as an oversized hero element dominating the center. Bold white headline at top, clean white footer bar with CTA and contact.
Creative hook: The product image should be dramatically large, almost bursting out of the frame. Add subtle diagonal shapes or energy lines behind the product for dynamism.
Mood: Bold, warm, appetizing, street-food energy.`,
    campaignModifiers: {
      ramadan: `Shift gradient to deep navy-to-gold. Subtle crescent moon element. Gold text replaces white. Calm and premium.`,
      eid: `Keep warm energy. Add subtle gold sparkle accents. Small festive badge.`,
    },
  },
  {
    id: "r-red-doodles",
    name: "Red Background with Doodles",
    category: "restaurant",
    directive: `Concept: Solid vibrant red canvas with the product floating as a cutout at center. Playful hand-drawn style CSS decorations scattered around — dashed curves, small sparkle stars, diagonal line bursts in white.
Creative hook: The doodle marks should feel energetic and hand-made, like someone sketched them around the food with chalk. Two-tone headline (gold first line, white second line).
Mood: Playful, energetic, casual street food.`,
    campaignModifiers: {
      ramadan: `Red becomes deep emerald green. Add a lantern silhouette in gold at a corner. Gold text stays.`,
      eid: `Mix gold starburst shapes into the white doodles. Add a thin gold border frame inset from edges.`,
    },
  },
  {
    id: "r-sunset-callouts",
    name: "Sunset Gradient with Callout Bubbles",
    category: "restaurant",
    directive: `Concept: Dramatic sunset gradient — dark navy at top through purple to warm golden orange at bottom. Product centered with small white speech-bubble callout badges around it pointing to features.
Creative hook: The callout bubbles with tiny pointer arrows create an infographic feel. Small sparkle marks near the headline. Moon glow at one corner, sun glow at the other.
Mood: Dramatic, atmospheric, premium fast-casual.`,
    campaignModifiers: {
      ramadan: `Top gradient deepens to navy with gold highlights. Add an Islamic arch shape framing the header. Moon becomes a proper crescent.`,
      eid: `Add warm gold sparkle effects scattered around. Bottom bar gets a festive gold stripe.`,
    },
  },
  {
    id: "r-retro-checkered",
    name: "Retro Checkered Pattern",
    category: "restaurant",
    directive: `Concept: Deep crimson base with a subtle checkered pattern overlay at low opacity. Massive cream-colored headline dominates the top half. Product below. CTA as a cream pill button.
Creative hook: The checkerboard pattern gives a retro diner feel. Scattered gold sparkle/star shapes at varying sizes add flair. The text should feel heavy and commanding.
Mood: Retro, bold, confident, warm.`,
    campaignModifiers: {
      ramadan: `Crimson becomes midnight blue. Checkered pattern in navy shades. Gold sparkles become crescent-and-star motifs. Thin gold line border.`,
      eid: `Keep red. Sparkles become larger and more festive. Add a gold confetti ribbon along the top.`,
    },
  },
  {
    id: "r-search-concept",
    name: "Creative Search Bar Concept",
    category: "restaurant",
    directive: `Concept: Warm amber background with a creative fake search bar UI element as the central design metaphor. The search bar contains the meal name as a "query", with a "did you mean..." suggestion line below pointing to the restaurant.
Creative hook: The search bar is the entire creative concept — a playful UI metaphor on a poster. Product image large below it. Minimal other decoration.
Mood: Clever, warm, conversational, modern.`,
    campaignModifiers: {
      ramadan: `Background becomes deep navy. Search text could reference Ramadan meals. Gold accents replace amber.`,
      eid: `Add small festive sparkles around the search bar. Shift to warm gold/cream tones.`,
    },
  },
  {
    id: "r-yellow-pop",
    name: "Bright Yellow Pop Art",
    category: "restaurant",
    directive: `Concept: Vivid bright yellow canvas with enormous black Arabic headline taking up major space. Red CTA pill below the text. Product fills the bottom half with a red starburst badge overlapping it.
Creative hook: The sheer size of the black text on yellow creates pop-art impact. Small black ink-splash teardrop marks near the headline for energy. Bold, graphic, minimal color palette.
Mood: Pop art, loud, punchy, street-food buzz.`,
    campaignModifiers: {
      ramadan: `Yellow becomes warm cream/gold. Red accents become deep green. Add subtle geometric Islamic pattern at very low opacity.`,
      eid: `Keep yellow. Add small colored confetti dots in red, green, and gold scattered lightly.`,
    },
  },
  {
    id: "r-triple-showcase",
    name: "Triple Product Showcase",
    category: "restaurant",
    directive: `Concept: Two-tone split — warm color top half, clean white bottom half. Three circular product images arranged horizontally across the boundary (large center, smaller flanks, all with white borders). Headline in white on the colored section.
Creative hook: The triple-circle layout IS the design. The circles straddle the color boundary, creating visual depth. Logo and contact info on the white section below.
Mood: Organized, abundant, inviting, clean.`,
    campaignModifiers: {
      ramadan: `Top color becomes deep green. Add a subtle Islamic arch at the top edge. Gold border accents on circles.`,
      eid: `Top color becomes festive gold. Add sparkle dots around the circular images.`,
    },
  },
  {
    id: "r-pizza-speed",
    name: "Speed Lines Delivery",
    category: "restaurant",
    directive: `Concept: Deep crimson background with horizontal white speed lines streaking past a circular product image. The lines create a sense of motion and delivery speed. Two-line headline at top with dynamic letter-spacing.
Creative hook: The speed lines (horizontal bars of varying width) are the entire design language — some pass behind the product, some in front, suggesting blur and movement.
Mood: Fast, dynamic, delivery-focused, urgent.`,
    campaignModifiers: {
      ramadan: `Red becomes deep navy. Speed lines become gold. Add a small crescent shape among the lines.`,
      eid: `Keep red. Add small gold starburst shapes at line endpoints.`,
    },
  },
  {
    id: "r-islamic-arch",
    name: "Islamic Arch Frame",
    category: "restaurant",
    directive: `Concept: Deep forest green canvas with an Islamic architectural arch framing the top section. Product in a large bordered circle at center. Mosque dome silhouettes along the bottom edge. Subtle geometric star pattern at very low opacity across the green.
Creative hook: The arch shape contains the headline and CTA. The silhouette cityscape at bottom grounds the composition. Gold accent lines throughout.
Mood: Cultural, spiritual, premium, architectural.`,
    campaignModifiers: {
      ramadan: `Already Ramadan-styled. Enhance with hanging lantern shapes from top corners in gold. Add "رمضان كريم" prominently.`,
      eid: `Green becomes deep blue. Warm gold accents and starburst sparkles. Arch border becomes gold. "عيد مبارك" replaces subtitle.`,
    },
  },
  {
    id: "r-elegant-frame",
    name: "Elegant Ornate Frame",
    category: "restaurant",
    directive: `Concept: Warm beige/sand background with subtle wood-plank texture lines at very low opacity. An ornate frame or label shape at top containing a greeting or brand name. Large headline in dark brown, product image below. Scattered small gold confetti dots in the lower section.
Creative hook: The ornate frame at top sets a premium, traditional tone. The gold confetti feels celebratory but restrained. Overall palette is cream, brown, and gold.
Mood: Premium, traditional, warm, curated.`,
    campaignModifiers: {
      ramadan: `Already Ramadan-themed. Add "رمضان كريم" in the ornate frame. Enhance gold confetti dots.`,
      eid: `Shift to cream + warm gold + celebratory green accents. Ornate frame in green. Mixed gold/green confetti.`,
    },
  },
];

// ── Supermarket Recipes ─────────────────────────────────────────

const SUPERMARKET_RECIPES: DesignRecipe[] = [
  {
    id: "s-fresh-green",
    name: "Fresh Green Produce",
    category: "supermarket",
    directive: `Concept: Rich supermarket green background with a massive white headline dominating the top. A starburst badge with discount text rotated slightly. Product collage arranged naturally at the bottom.
Creative hook: The starburst badge is the eye-catcher — bold discount percentage inside a CSS star shape. Products feel abundant, like a market display.
Mood: Fresh, energetic, value-driven, bold.`,
    campaignModifiers: {
      ramadan: `Green deepens. Add crescent moon shape near starburst. Yellow accents become warm gold.`,
      eid: `Add festive gold border around canvas edges. Small gold starburst sparkles scattered.`,
    },
  },
  {
    id: "s-essentials-card",
    name: "Essentials Bundle Card",
    category: "supermarket",
    directive: `Concept: Two-tone vertical split — light warm section on top, rich green section below. Product image positioned at the boundary, floating between both worlds. Bold dark headline on the light section, starburst discount badge overlapping the product.
Creative hook: The product straddling the color boundary creates a dramatic floating effect. Optional wavy divider line instead of straight.
Mood: Clean, organized, trustworthy, retail.`,
    campaignModifiers: {
      ramadan: `Light section becomes cream. Add gold ornamental line at the section boundary.`,
      eid: `Light section becomes pale gold. Small sparkle decorations around the product.`,
    },
  },
  {
    id: "s-floating-vegetables",
    name: "Floating Produce Explosion",
    category: "supermarket",
    directive: `Concept: Fresh green background with a massive headline and products bursting outward with a sense of overflow and abundance. Wide yellow CTA banner stretches across the bottom.
Creative hook: Design the composition as if products are flying out of a shopping bag — a sense of dynamic explosion and plenty. Subtle dotted/dashed lines suggest motion around products.
Mood: Dynamic, abundant, energetic, value.`,
    campaignModifiers: {
      ramadan: `Green deepens. CTA bar becomes gold with dark text. Add thin crescent motif near headline.`,
      eid: `Add confetti effect — small multi-colored dots scattered lightly. CTA bar stays yellow.`,
    },
  },
  {
    id: "s-weekly-deal",
    name: "Weekly Deal Spotlight",
    category: "supermarket",
    directive: `Concept: Warm red-orange background with radial gradient for depth. Product centered (possibly circle-cropped) with radiating explosion rays behind it at low opacity. Massive price text below. Banner shape at top with deal label.
Creative hook: The radiating rays create "spotlight on a deal" energy without being tacky. Price is the largest element on the poster. Old price with strikethrough nearby.
Mood: Exciting, sale energy, spotlight, urgent.`,
    campaignModifiers: {
      ramadan: `Red-orange becomes deep navy. Yellow rays become gold. Subtle Islamic geometric pattern at low opacity.`,
      eid: `Keep red energy. Small gold starburst badges at corners. Very festive.`,
    },
  },
  {
    id: "s-clean-minimal",
    name: "Clean Minimal Supermarket",
    category: "supermarket",
    directive: `Concept: Premium white/off-white canvas with generous whitespace. Dark headline, subtle product shadow, and a green circle price badge overlapping the product corner. Thin green accent line under the header.
Creative hook: Whitespace IS the design. Minimal elements — the restraint itself communicates premium quality. Only decorations are the thin line and the price circle.
Mood: Premium, minimal, clean, confident.`,
    campaignModifiers: {
      ramadan: `Add subtle gold accent lines. Faint Islamic star pattern watermark at very low opacity. Green accents deepen.`,
      eid: `Warm gold tint to background. Small confetti dots at very low opacity. Festive but still clean.`,
    },
  },
  {
    id: "s-split-offer",
    name: "Split Offer Combo",
    category: "supermarket",
    directive: `Concept: Light cream/ivory background with subtle geometric pattern at very low opacity. Two large circular product images side by side with a "+" symbol between them. Ornamental border pattern along top and bottom edges. Smaller product circles in a row below.
Creative hook: The combo layout — large circles with "+" — immediately communicates "bundle deal." Curved arcs behind the circles add elegance. Ornate geometric border frames the composition.
Mood: Premium, traditional, curated, combo deal.`,
    campaignModifiers: {
      ramadan: `Pattern becomes Islamic arabesques. Gold accents on border. "عروض رمضان" badge at top.`,
      eid: `Add celebratory green accents mixed with brown. Gold sparkle dots. "عروض العيد" badge at top.`,
    },
  },
  {
    id: "s-orange-wave",
    name: "Orange Wave Banner",
    category: "supermarket",
    directive: `Concept: Top half warm orange, bottom half white, separated by a wavy curved divider line. Product sits on the wave boundary — half in each zone. Logo and info on the white section below.
Creative hook: The wavy CSS clip-path divider IS the entire design feature. The product floating on it creates depth. Faint doodle illustrations at very low opacity on the white section.
Mood: Warm, friendly, modern, approachable.`,
    campaignModifiers: {
      ramadan: `Orange becomes deep green. Add golden trim line along the wave edge. White section gets faint Islamic pattern.`,
      eid: `Orange becomes warm gold. Add small sparkles along the wave line.`,
    },
  },
  {
    id: "s-price-explosion",
    name: "Price Explosion Tag",
    category: "supermarket",
    directive: `Concept: Bright yellow background with radial gradient. Price is the HERO — the largest, most dominant element. Old price strikethrough with arrow to massive new price in red. Product centered below. Green CTA pill at bottom.
Creative hook: Short explosion dashes radiate from the price text in the accent color. A price tag shape hangs from the corner. The entire composition screams "deal."
Mood: Sale explosion, urgent, bold, value-first.`,
    campaignModifiers: {
      ramadan: `Yellow becomes cream/gold. Green stays. Add crescent silhouette. More premium, less explosive.`,
      eid: `Keep yellow energy. Multi-colored confetti. "عروض العيد" badge.`,
    },
  },
];

// ── Online Store Recipes ────────────────────────────────────────

const ONLINE_RECIPES: DesignRecipe[] = [
  {
    id: "o-blush-pedestal",
    name: "Blush Pedestal Display",
    category: "online",
    directive: `Concept: Soft blush pink canvas with organic blob shapes in slightly darker pink at the edges. Product displayed on an elegant elliptical pedestal with subtle shadow. Delicate leaf/branch shapes at top corners at low opacity.
Creative hook: The pedestal grounds the product with an e-commerce "product shot" feel. Organic blobs create a soft, feminine atmosphere. Muted mauve CTA pill.
Mood: Feminine, premium, soft, elegant.`,
    campaignModifiers: {
      ramadan: `Blush shifts to cream/champagne. Small gold lantern shapes. Darker text. Gold accents.`,
      eid: `Blush stays. Soft gold sparkle elements around the product. Subtle celebratory confetti.`,
    },
  },
  {
    id: "o-features-split",
    name: "Feature List Split",
    category: "online",
    directive: `Concept: Split screen — colored section on one side with the product, off-white section on the other with headline and stacked feature pills (rounded rectangles with benefit text). The split can be diagonal or straight.
Creative hook: The feature pills create rhythm and information hierarchy — each pill is a product benefit. Small decorative dot clusters at the bottom for balance.
Mood: Modern, informative, e-commerce, clean.`,
    campaignModifiers: {
      ramadan: `Colored section becomes deep navy or green. Feature pills become gold-bordered with dark text. Subtle crescent motif.`,
      eid: `Softer color tone. Small sparkles around features. Gold accent border between the two sides.`,
    },
  },
  {
    id: "o-ramadan-gold",
    name: "Ramadan Gold Elegance",
    category: "online",
    directive: `Concept: Off-white/cream canvas with faint diagonal silk-like streaks. Large discount number as hero text on one side. Product positioned on the other side. Hanging lanterns at top in gold. Elegant calligraphy greeting at bottom with a decorative gold line.
Creative hook: The hanging lanterns built from CSS shapes are the signature element. The massive discount percentage number dominates. Luxurious and minimal.
Mood: Luxurious, spiritual, premium, MENA heritage.`,
    campaignModifiers: {
      ramadan: `This IS the Ramadan recipe. Enhance lanterns, add crescent moon.`,
      eid: `Replace lanterns with starburst/sparkle decorations. "عيد مبارك" replaces Ramadan calligraphy. Warm gold tint.`,
    },
  },
  {
    id: "o-vibrant-product",
    name: "Vibrant Product Showcase",
    category: "online",
    directive: `Concept: Bold vibrant amber/orange background with an enormous white headline. Product positioned prominently to one side. Small white circular badges with product features connected by thin dashed lines to the product.
Creative hook: The info badges with dashed connector lines create an "anatomy diagram" effect — dissecting the product's benefits. CSS sparkle stars scattered around in white.
Mood: Bold, energetic, informative, confident.`,
    campaignModifiers: {
      ramadan: `Orange becomes deep teal. White accents become cream/gold. Sparkles become crescent-and-star motifs.`,
      eid: `Keep orange. Sparkles become gold and larger. Small "عيد مبارك" badge at top corner.`,
    },
  },
  {
    id: "o-purple-arch",
    name: "Purple Gradient Arch",
    category: "online",
    directive: `Concept: Light blush/off-white canvas with a large arch/dome shape filled with a purple-to-pink gradient as the dominant visual element. Product tagline in white inside the arch. Products arranged at the arch base, slightly overflowing its boundary.
Creative hook: The gradient-filled arch is the entire composition anchor — everything else orbits around it. Small white sparkle stars inside the arch. Brand info above and social below.
Mood: Modern, vibrant, beauty/wellness, statement.`,
    campaignModifiers: {
      ramadan: `Purple/pink gradient becomes navy-to-gold. Arch gets a subtle Islamic geometric border. Sparkles become crescents.`,
      eid: `Keep purple but lighter. Add gold sparkles inside the arch. Festive energy.`,
    },
  },
  {
    id: "o-bokeh-beauty",
    name: "Bokeh Glow Beauty",
    category: "online",
    directive: `Concept: Soft blue-to-white gradient background with dreamy bokeh circles of varying sizes at low opacity creating a spa-like atmosphere. Bold headline on one side in deep purple. Pricing boxes stacked below. Product/model fills the other side.
Creative hook: The bokeh glow circles create depth and luxury — each is a CSS radial gradient fading to transparent. Pricing uses clean, structured boxes with contrasting inner color.
Mood: Luxurious, spa-like, dreamy, beauty.`,
    campaignModifiers: {
      ramadan: `Blue becomes warm cream/gold. Bokeh circles become gold-tinted. Add lantern motif.`,
      eid: `Blue becomes celebratory pink/gold. Sparkles mixed with bokeh. Festive glow.`,
    },
  },
  {
    id: "o-brown-cafe",
    name: "Warm Cafe Aesthetic",
    category: "online",
    directive: `Concept: Two-tone split — warm cream/beige on top, chocolate brown on bottom, separated by a large organic curved divider. Brand logo in a colored circle sits at the curve boundary. Product on the brown section with white border. Footer items in translucent pill shapes.
Creative hook: The organic curved CSS divider creates a cozy, handmade feel. Faint cafe doodles at ultra-low opacity on the cream section. Pill-shaped footer items.
Mood: Cozy, warm, artisanal, coffeehouse.`,
    campaignModifiers: {
      ramadan: `Cream becomes deeper cream/gold. Add gold lantern or crescent at the curve peak. "رمضان كريم" in gold on brown section.`,
      eid: `Warm gold sparkles on the brown section. Cream section gets subtle celebratory dots.`,
    },
  },
  {
    id: "o-gradient-modern",
    name: "Modern Gradient Float",
    category: "online",
    directive: `Concept: Premium dark gradient — deep charcoal to warm dark brown. Product floating on the dark background with an ambient golden glow around it. Gold headline, white price, gold CTA pill. Thin gold horizontal lines for structure.
Creative hook: The golden ambient glow makes the product look like it's levitating in darkness. Very minimal elements — the darkness and glow do all the work. Optional subtle gold particle dots at very low opacity.
Mood: Luxury, dark, premium, high-end e-commerce.`,
    campaignModifiers: {
      ramadan: `Add Islamic geometric gold pattern overlay at very low opacity. Subtle crescent. "رمضان مبارك" in elegant gold.`,
      eid: `Add gold sparkle clusters. More warm gold glow. "عيد سعيد" text.`,
    },
  },
];

// ── Recipe Pools Map ────────────────────────────────────────────

const RECIPE_POOLS: Record<Category, DesignRecipe[]> = {
  restaurant: RESTAURANT_RECIPES,
  supermarket: SUPERMARKET_RECIPES,
  online: ONLINE_RECIPES,
};

// ── Selection Function ──────────────────────────────────────────

/**
 * Select `count` unique random recipes from the pool for a given category.
 * Ensures no recipe is repeated within a batch.
 */
export function selectRecipes(
  category: Category,
  count: number
): DesignRecipe[] {
  const pool = RECIPE_POOLS[category];
  if (pool.length === 0) return [];

  // Fisher-Yates shuffle on a copy
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Format a recipe directive with optional campaign modifiers applied.
 */
export function formatRecipeForPrompt(
  recipe: DesignRecipe,
  campaignType: CampaignType
): string {
  let directive = recipe.directive;

  const modifier = recipe.campaignModifiers[campaignType];
  if (modifier) {
    directive += `\n\nCampaign twist (${campaignType}): ${modifier}`;
  }

  return `## Creative Brief: "${recipe.name}"
Use this brief as your creative starting point. Let the reference images guide your specific aesthetic choices.

${directive}

Interpret freely. The brief describes a concept and mood, not a pixel specification.`;
}
