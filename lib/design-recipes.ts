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
    directive: `Concept: Two-tone split — warm color top half, clean white bottom half. One large circular product image at center straddling the boundary (with white border), flanked by two smaller decorative circles using abstract color fills or subtle gradient patterns (NOT duplicates of the product). Headline in white on the colored section.
Creative hook: The circle layout creates visual depth across the color boundary. The flanking circles use complementary abstract patterns, not product copies. Logo and contact info on the white section below.
Mood: Organized, inviting, clean.`,
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

// ── E-commerce Recipes ──────────────────────────────────────────

const ECOMMERCE_RECIPES: DesignRecipe[] = [
  {
    id: "o-blush-pedestal",
    name: "Blush Pedestal Display",
    category: "ecommerce",
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
    category: "ecommerce",
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
    category: "ecommerce",
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
    category: "ecommerce",
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
    category: "ecommerce",
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
    category: "ecommerce",
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
    category: "ecommerce",
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
    category: "ecommerce",
    directive: `Concept: Premium dark gradient — deep charcoal to warm dark brown. Product floating on the dark background with an ambient golden glow around it. Gold headline, white price, gold CTA pill. Thin gold horizontal lines for structure.
Creative hook: The golden ambient glow makes the product look like it's levitating in darkness. Very minimal elements — the darkness and glow do all the work. Optional subtle gold particle dots at very low opacity.
Mood: Luxury, dark, premium, high-end e-commerce.`,
    campaignModifiers: {
      ramadan: `Add Islamic geometric gold pattern overlay at very low opacity. Subtle crescent. "رمضان مبارك" in elegant gold.`,
      eid: `Add gold sparkle clusters. More warm gold glow. "عيد سعيد" text.`,
    },
  },
];

// ── Services Recipes ────────────────────────────────────────────

const SERVICES_RECIPES: DesignRecipe[] = [
  {
    id: "sv-clean-corporate",
    name: "Clean Corporate Split",
    category: "services",
    directive: `Concept: Vertical split layout — deep navy left panel with white text and service name, crisp white right panel with service details and CTA. A thin accent line in teal or electric blue separates the two halves. Company logo centered at the split boundary inside a white circle.
Creative hook: The navy/white contrast communicates trust and professionalism instantly. The accent line is the only color pop — everything else is restrained. Subtle geometric grid dots at very low opacity on the navy panel. Clean sans-serif typography throughout.
Mood: Corporate, trustworthy, clean, authoritative.`,
    campaignModifiers: {
      ramadan: `Navy deepens to midnight. Accent line becomes warm gold. Add a subtle crescent watermark on the navy panel. "رمضان كريم" greeting in gold script below the logo.`,
      eid: `Navy lightens slightly. Gold accent line and gold dot decorations along the split boundary. Small "عيد مبارك" badge at top corner.`,
    },
  },
  {
    id: "sv-trust-badges",
    name: "Trust Badges Icon Grid",
    category: "services",
    directive: `Concept: Light gray or off-white canvas with a bold dark headline at top. Below it, a 2x2 or 3x1 grid of rounded cards, each containing a simple geometric icon shape (circle, shield, checkmark) and a short benefit label. Subtle shadow on each card for depth. CTA pill button centered at the bottom.
Creative hook: The icon grid IS the design — each card feels like a trust signal. Cards have a thin colored left border or top border as accent. Background has faint diagonal lines at ultra-low opacity for texture. The grid communicates "organized, reliable, multi-benefit."
Mood: Professional, structured, informative, reassuring.`,
    campaignModifiers: {
      ramadan: `Card borders become gold. Background shifts to warm cream. Add a small lantern icon shape in one card. "عروض رمضان" label at top.`,
      eid: `Cards get subtle gold shimmer borders. Small sparkle dots between cards. Warm celebratory tone.`,
    },
  },
  {
    id: "sv-gradient-card",
    name: "Modern Gradient Service Card",
    category: "services",
    directive: `Concept: Full-bleed gradient from deep indigo at top to vibrant teal at bottom. A large frosted-glass card (semi-transparent white with blur effect) centered on the gradient, containing service title, description, and pricing. Subtle floating geometric shapes (circles, hexagons) in white at low opacity scattered behind the card.
Creative hook: The frosted card hovering over a vibrant gradient creates a modern SaaS/tech aesthetic. The geometric shapes suggest innovation and precision. White text above the card for the headline, card itself uses dark text.
Mood: Modern, tech-forward, innovative, premium.`,
    campaignModifiers: {
      ramadan: `Gradient shifts to navy-to-deep-purple. Floating shapes become subtle crescents and stars. Card border gets a thin gold line. "عروض رمضان" in gold above the card.`,
      eid: `Gradient becomes warm purple-to-gold. Geometric shapes become gold-tinted sparkles. Festive but still modern.`,
    },
  },
  {
    id: "sv-timeline-steps",
    name: "Step-by-Step Timeline",
    category: "services",
    directive: `Concept: Clean white canvas with a vertical or horizontal timeline showing 3-4 service steps. Each step is a numbered circle connected by a dashed line, with a short label beside it. The active/featured step is highlighted with the brand color fill. Bold headline at top in dark charcoal, CTA at the bottom.
Creative hook: The timeline visualization makes a service process feel simple and approachable. Numbered circles create a clear visual path. The highlighted step draws the eye. Subtle background: faint blueprint-grid pattern at ultra-low opacity.
Mood: Clear, systematic, approachable, educational.`,
    campaignModifiers: {
      ramadan: `Timeline line becomes gold. Step circles get gold borders. Background shifts to warm cream. Add a small crescent at the timeline start point.`,
      eid: `Step circles become festive with gold fill. Add tiny sparkle marks at each step node. Warm gold CTA button.`,
    },
  },
  {
    id: "sv-blue-wave",
    name: "Blue Wave Service Hero",
    category: "services",
    directive: `Concept: Top section in deep professional blue with white headline text and service tagline. Bottom section in white with contact details and CTA. A large sweeping wave or curve divider separates the two sections, created with CSS clip-path. Service image or icon centered at the wave boundary.
Creative hook: The bold wave divider creates energy while remaining professional. The service image breaking the wave boundary adds depth and visual interest. Small dot grid pattern on the blue section at low opacity. The wave suggests flow and reliability.
Mood: Dynamic, professional, reliable, service-oriented.`,
    campaignModifiers: {
      ramadan: `Blue deepens to navy. Wave edge gets a thin gold trim line. Add hanging lantern shapes in gold above the wave. "رمضان كريم" in the blue section.`,
      eid: `Blue becomes rich royal blue. Gold sparkle accents along the wave line. Festive badge in the white section.`,
    },
  },
  {
    id: "sv-minimal-pro",
    name: "Ultra-Minimal Professional",
    category: "services",
    directive: `Concept: Pure white canvas with maximum whitespace. A single thin horizontal line divides the poster into upper and lower zones. Service name in large, light-weight typography at top. A single accent-colored geometric shape (rectangle or circle) contains the key message or price. Contact details in small, refined text at the very bottom.
Creative hook: Radical minimalism — the empty space itself communicates confidence and premium positioning. Only two colors: black/charcoal text and one accent color. The geometric accent shape is the sole decorative element. No clutter, no noise.
Mood: Ultra-premium, confident, architectural, minimal.`,
    campaignModifiers: {
      ramadan: `Accent shape becomes gold. Add a single thin crescent line drawing near the headline. Warm off-white background instead of pure white.`,
      eid: `Accent shape in warm gold. Two small sparkle marks flanking the headline. Subtle warmth added to the composition.`,
    },
  },
  {
    id: "sv-checkmark-list",
    name: "Feature Checklist with CTA",
    category: "services",
    directive: `Concept: Left-aligned layout on a soft gray-blue background. Bold dark headline at top followed by a vertical checklist of 4-5 service features, each prefixed with a colored checkmark icon in a small circle. Large accent-colored CTA button at the bottom spanning most of the width. Company logo and contact in a slim footer bar.
Creative hook: The checklist format is inherently persuasive — it triggers a "yes, yes, yes" response. Each checkmark circle uses the brand color. The oversized CTA button creates urgency. Subtle diagonal stripe pattern at very low opacity in the background.
Mood: Persuasive, organized, action-oriented, trustworthy.`,
    campaignModifiers: {
      ramadan: `Background becomes warm cream. Checkmark circles become gold. Add a crescent icon as the first list item decoration. CTA becomes deep green with gold text.`,
      eid: `Checkmark circles become festive gold. Add small sparkle accents beside the CTA. "عروض العيد" label above the checklist.`,
    },
  },
  {
    id: "sv-gold-premium",
    name: "Premium Gold-Accented Dark",
    category: "services",
    directive: `Concept: Deep charcoal or near-black background with gold as the sole accent color. Service name in large gold serif or display typography. A thin gold border frame inset from the edges. Key service details in white text, centered. Small gold decorative corner flourishes — simple geometric angles, not ornate.
Creative hook: The dark + gold combination instantly signals premium and exclusivity. The inset border frame creates a "certificate" or "invitation" quality. Corner flourishes add just enough elegance without being busy. Maximum contrast between gold text and dark background.
Mood: Luxury, exclusive, premium, high-end services.`,
    campaignModifiers: {
      ramadan: `Add a subtle Islamic geometric pattern in gold at very low opacity across the background. Small crescent shape integrated into a corner flourish. "رمضان مبارك" in elegant gold calligraphy.`,
      eid: `Gold accents become warmer and brighter. Add small gold sparkle/starburst shapes at the corners. "عيد مبارك" in prominent gold text.`,
    },
  },
];

// ── Fashion Recipes ─────────────────────────────────────────────

const FASHION_RECIPES: DesignRecipe[] = [
  {
    id: "fa-editorial-split",
    name: "Magazine Editorial Split",
    category: "fashion",
    directive: `Concept: Vertical asymmetric split — narrow left column in solid black with vertical white text (collection name or season), wide right section with the product/model image filling the space. A thin white line separates the columns. Small brand logo at bottom-left, price or CTA at bottom-right in clean white text on a translucent dark bar.
Creative hook: The asymmetric split mimics high-fashion magazine layouts. The vertical text on the narrow panel creates intrigue and forces the viewer to tilt their head — a classic editorial trick. Ultra-clean typography, no decorative elements.
Mood: Editorial, high-fashion, magazine-quality, sophisticated.`,
    campaignModifiers: {
      ramadan: `Left column becomes deep navy with gold vertical text. Add a thin gold accent line. Subtle crescent at the top of the narrow column.`,
      eid: `Left column stays black but text becomes warm gold. Small gold dot decorations along the dividing line. Celebratory yet refined.`,
    },
  },
  {
    id: "fa-blush-minimal",
    name: "Soft Blush Minimalist",
    category: "fashion",
    directive: `Concept: Warm blush pink canvas with the product/model as the dominant central element, taking up 60-70% of the space. Ultra-thin serif headline in dark charcoal at the very top. Small, refined price text with a thin underline. Organic soft shadow beneath the product. No borders, no frames — just the product breathing in pink space.
Creative hook: The blush pink creates a soft, feminine runway feel. The extreme minimalism lets the product speak entirely for itself. Tiny dot accents (3-4 small circles) in mauve near one corner as the only decoration.
Mood: Soft, feminine, editorial, runway-ready.`,
    campaignModifiers: {
      ramadan: `Blush becomes warm champagne/cream. Headline in deep burgundy with a thin gold underline. Small gold crescent near the dot accents.`,
      eid: `Blush stays. Dot accents become gold. Add a single line of "عيد مبارك" in elegant thin serif below the price.`,
    },
  },
  {
    id: "fa-dark-luxury",
    name: "Dark Luxury Showcase",
    category: "fashion",
    directive: `Concept: Matte black background with the product lit dramatically — a single spotlight effect creating a bright focal point surrounded by darkness. Headline in white condensed uppercase tracking wide. A slim metallic silver or platinum accent line below the headline. Price in a small, refined pill shape.
Creative hook: The spotlight-in-darkness technique creates a high-end boutique window display feel. The wide letter-spacing on the headline suggests luxury brands. Everything is restrained — darkness does the heavy lifting. Optional: faint smoke/mist gradient at the bottom.
Mood: Luxurious, dark, boutique, high-end.`,
    campaignModifiers: {
      ramadan: `Silver accents become gold. Add a faint gold geometric pattern overlay at extremely low opacity. Small crescent integrated into the accent line.`,
      eid: `Gold accents throughout. Small gold sparkle dots scattered in the dark space around the product. Festive yet dark and premium.`,
    },
  },
  {
    id: "fa-collection-grid",
    name: "Collection Grid Layout",
    category: "fashion",
    directive: `Concept: Off-white canvas divided into a grid — one large feature cell (taking 2/3 of the space) with the hero product, and 2-3 smaller cells filled with complementary color swatches, abstract textures, or brand-colored patterns (NOT duplicates of the product). Thin dark lines separate the cells. Collection name in bold sans-serif at the top, spanning the full width.
Creative hook: The grid layout mimics a curated lookbook page. The size hierarchy (one large cell, smaller accent cells) creates visual interest. Grid lines are thin and precise. The smaller cells use abstract fills that complement the product's palette.
Mood: Curated, editorial, catalog, organized.`,
    campaignModifiers: {
      ramadan: `Grid lines become gold. Off-white shifts to warm cream. Add "تشكيلة رمضان" as the collection name. Small crescent icon in one cell corner.`,
      eid: `Grid lines stay dark. Add gold corner accents on each cell. "تشكيلة العيد" as the collection name.`,
    },
  },
  {
    id: "fa-diagonal-modern",
    name: "Diagonal Cut Modern",
    category: "fashion",
    directive: `Concept: Bold diagonal cut dividing the canvas — top-left triangle in a solid color (coral, cobalt, or emerald), bottom-right section with the product image. The diagonal line is sharp and clean. Headline text in white, rotated to follow the diagonal angle. Small brand badge at one corner.
Creative hook: The diagonal slash is aggressive and modern — it breaks the expected rectangular grid. The rotated text following the angle creates kinetic energy. The color block is pure and undecorated. Single strong color + product image = maximum impact.
Mood: Bold, modern, angular, streetwear-meets-high-fashion.`,
    campaignModifiers: {
      ramadan: `Color block becomes deep navy or forest green. Add a thin gold line along the diagonal cut. Small crescent shape at the triangle peak.`,
      eid: `Color block becomes warm gold. Diagonal edge gets a subtle sparkle texture. Dynamic festive energy.`,
    },
  },
  {
    id: "fa-price-slash",
    name: "Bold Price Slash Discount",
    category: "fashion",
    directive: `Concept: Split background — rich burgundy or wine red on top, white on bottom. A massive diagonal "slash" graphic element (thick line or ribbon) cuts across the center with the discount percentage inside it. Original price struck through above, sale price bold below. Product positioned to one side with attitude.
Creative hook: The slash graphic is both literal (price slash) and visual (cutting through the layout). The diagonal creates tension and urgency. Burgundy communicates premium while red energy drives the sale message. Bold condensed typography for the prices.
Mood: Sale urgency, premium discount, bold, fashion-forward.`,
    campaignModifiers: {
      ramadan: `Burgundy becomes deep navy. Slash becomes gold. Add "عروض رمضان" in the slash ribbon. Elegant sale, not aggressive.`,
      eid: `Burgundy stays. Gold sparkle accents around the slash. "تخفيضات العيد" label. Festive urgency.`,
    },
  },
  {
    id: "fa-neutral-elegance",
    name: "Neutral Tones Elegance",
    category: "fashion",
    directive: `Concept: Warm neutral palette — sand, taupe, and cream layered as overlapping rectangular blocks offset from each other, creating depth. Product placed where the blocks overlap. Headline in dark charcoal with elegant spacing. A thin golden rule line below the headline. Social media icons in a tiny row at the very bottom.
Creative hook: The overlapping neutral rectangles create a collage/mood-board aesthetic common in fashion branding. The golden rule line is the only metallic accent — it signals quality without shouting. Earth-tone sophistication throughout.
Mood: Earthy, sophisticated, neutral, editorial.`,
    campaignModifiers: {
      ramadan: `Neutral tones deepen slightly. Golden rule line becomes more prominent. Add a subtle crescent shape in one of the overlapping blocks at low opacity.`,
      eid: `Warm gold replaces the taupe block. Small golden sparkle dots at block corners. Subtle festive warmth.`,
    },
  },
  {
    id: "fa-street-bold",
    name: "Street Fashion Bold Typography",
    category: "fashion",
    directive: `Concept: High-contrast black and white base with one punchy accent color (electric yellow, neon green, or hot pink). Massive bold headline in the accent color, taking up nearly half the canvas. Product below in a raw, unpolished composition — slightly rotated or off-grid. Grungy texture overlay at very low opacity. Small text details scattered intentionally "messy."
Creative hook: The oversized colored text on black creates streetwear poster energy. The slightly off-grid product placement feels rebellious and intentional. The grunge texture (noise/grain dots) adds underground authenticity. One accent color only — discipline within chaos.
Mood: Street, urban, rebellious, bold, youthful.`,
    campaignModifiers: {
      ramadan: `Accent color becomes gold on deep navy. Tone shifts from rebellious to "cool premium." Small crescent integrated into the typography. Grunge texture replaced with subtle geometric pattern.`,
      eid: `Accent color stays bold. Add gold starburst shapes mixed into the composition. "عيد" in massive accent-colored text as part of the headline.`,
    },
  },
];

// ── Beauty Recipes ──────────────────────────────────────────────

const BEAUTY_RECIPES: DesignRecipe[] = [
  {
    id: "be-soft-glow",
    name: "Soft Pink Glow",
    category: "beauty",
    directive: `Concept: Warm rose-pink gradient background with multiple bokeh circles of varying sizes in lighter pink and white, creating a dreamy glow effect. Product centered with a soft white halo glow around it. Headline in white with delicate letter-spacing. Small rose-gold CTA pill at the bottom.
Creative hook: The bokeh circles create a "soft focus" beauty photography feel entirely through CSS gradients. The white halo around the product makes it feel luminous and precious. Overall effect is like looking through a soft-focus lens. Very light, airy, and feminine.
Mood: Dreamy, soft, feminine, radiant, spa-like.`,
    campaignModifiers: {
      ramadan: `Pink shifts to warm champagne/gold. Bokeh circles become golden. Add a small crescent shape among the bokeh. Text becomes deep brown with gold accents.`,
      eid: `Pink stays but gets warmer. Bokeh circles gain gold tints. Small sparkle stars mixed with the circles. Celebratory glow.`,
    },
  },
  {
    id: "be-gold-shimmer",
    name: "Gold Shimmer Premium",
    category: "beauty",
    directive: `Concept: Rich warm gradient from deep bronze at the edges to bright gold at the center, creating a metallic shimmer effect. Product floating at center with a subtle reflection below it. Headline in white with a thin gold underline. Small diamond-shaped decorative elements scattered sparingly. Price in a translucent dark pill.
Creative hook: The bronze-to-gold gradient creates a liquid metal shimmer feel. The product reflection suggests a polished surface. Diamond shapes (CSS rotated squares) add sparkle without clutter. The entire poster feels like a luxury cosmetics counter.
Mood: Luxurious, golden, premium, cosmetics-counter quality.`,
    campaignModifiers: {
      ramadan: `Gold deepens to amber-to-navy gradient. Diamond shapes become crescent-and-star motifs. "عروض رمضان" in elegant white script.`,
      eid: `Gold becomes brighter and warmer. More diamond sparkle shapes. "عيد مبارك" in prominent gold-on-dark text.`,
    },
  },
  {
    id: "be-before-after",
    name: "Before/After Comparison",
    category: "beauty",
    directive: `Concept: Clean horizontal split — left side slightly desaturated/muted with "قبل" (before) label, right side vibrant and glowing with "بعد" (after) label. A thin vertical line or gradient transition separates them. Product placed at the boundary, bridging both sides. Bold headline at top, results-focused subtitle below.
Creative hook: The before/after split is the most powerful visual metaphor in beauty marketing. The desaturation-to-vibrance transition tells the story instantly. The product at the boundary is the "bridge" — the solution. Clean typography keeps focus on the transformation.
Mood: Transformative, results-driven, clean, convincing.`,
    campaignModifiers: {
      ramadan: `"After" side shifts to warm golden tones. Add a small crescent icon near the headline. Transition line becomes gold. "عروض رمضان" badge at top.`,
      eid: `"After" side gets warm festive glow. Small sparkle accents on the vibrant side. "عروض العيد" label. Celebratory transformation.`,
    },
  },
  {
    id: "be-pastel-card",
    name: "Pastel Card with Rounded Elements",
    category: "beauty",
    directive: `Concept: Soft lavender or mint green background with a large white rounded-corner card centered on the canvas. Product image inside the card with generous padding. Rounded pill-shaped elements for price and CTA in pastel accent colors. Small circular dots in coordinating pastels scattered around the card exterior. Headline above the card in dark text.
Creative hook: The rounded card with rounded pills and circular dots creates an entirely "soft" visual language — no sharp corners anywhere. This softness is inherently beauty/skincare-coded. The pastel palette feels fresh and clean. The card creates a "product spotlight" effect.
Mood: Fresh, soft, playful, skincare-clean.`,
    campaignModifiers: {
      ramadan: `Lavender becomes warm cream. Card border gets a thin gold line. Pastel pills become gold-tinted. Small crescent shape among the scattered dots.`,
      eid: `Pastels become warmer. Scattered dots gain gold accents. Card gets a subtle gold shimmer border. Festive softness.`,
    },
  },
  {
    id: "be-luxury-dark",
    name: "Dark Beauty Luxury",
    category: "beauty",
    directive: `Concept: Deep matte black background with the product dramatically lit from one side, creating a strong light-to-shadow gradient across its surface. Headline in thin, elegant white serif typography with extreme letter-spacing. A single accent color — deep berry, wine red, or mauve — used for the CTA and one decorative line. Subtle particle dots in white at very low opacity suggesting shimmer.
Creative hook: The dramatic side-lighting creates high-end beauty campaign energy. The extreme letter-spacing on thin serif text whispers luxury. The single accent color is used with surgical precision — only where it matters. Black negative space dominates.
Mood: High-end beauty, dramatic, editorial, luxurious.`,
    campaignModifiers: {
      ramadan: `Accent color becomes gold. Add a faint Islamic star pattern in gold at extremely low opacity. "رمضان" in thin gold serif. Premium spiritual mood.`,
      eid: `Accent color becomes warm rose-gold. Gold particle dots increase in density. "عيد مبارك" in elegant serif. Festive luxury.`,
    },
  },
  {
    id: "be-floral-frame",
    name: "Floral Decorative Frame",
    category: "beauty",
    directive: `Concept: Warm off-white or pale pink canvas with an ornate floral/botanical frame border created from CSS shapes — circles for petals, curved lines for stems, small dots for buds. The frame is in soft rose-gold or dusty pink. Product centered within the frame. Headline in elegant script-style placement above the product, inside the frame boundary.
Creative hook: The floral frame transforms the poster into a perfume box or luxury skincare packaging aesthetic. The botanical elements are abstract and geometric — not realistic flowers, but the suggestion of them through circles, arcs, and dots. The frame contains and elevates everything inside it.
Mood: Botanical, elegant, packaging-quality, feminine.`,
    campaignModifiers: {
      ramadan: `Floral frame becomes gold on cream background. Add small crescent shapes woven into the botanical elements. "رمضان كريم" in the frame header area.`,
      eid: `Frame becomes warm gold with green leaf accents. Small sparkle dots among the floral elements. "عيد مبارك" integrated into the frame top.`,
    },
  },
  {
    id: "be-clean-spa",
    name: "Clean Spa Minimal",
    category: "beauty",
    directive: `Concept: Pure white canvas with a single horizontal band of soft sage green or seafoam across the middle third. Product placed on the green band with a subtle shadow. Headline above in dark charcoal, description below in light gray. A thin sage-green line above and below the band. Small leaf or water-drop shape as the only decorative element.
Creative hook: The horizontal color band creates a "shelf" for the product — like a spa display. The sage green communicates natural, clean, wellness. Extreme whitespace above and below the band creates breathing room. The single leaf/drop shape is the brand's nature signal.
Mood: Spa, clean, natural, wellness, serene.`,
    campaignModifiers: {
      ramadan: `Green band becomes warm gold/sand. Add a small crescent shape replacing the leaf. Headline in warm dark brown. "عروض رمضان" in refined small text.`,
      eid: `Green band gets a subtle gold gradient edge. Leaf shape becomes a sparkle. Small gold dots along the band edges. Quiet celebration.`,
    },
  },
  {
    id: "be-gradient-dream",
    name: "Dreamy Gradient with Soft Overlays",
    category: "beauty",
    directive: `Concept: Full-bleed gradient flowing from soft peach at top-left to lavender at bottom-right, creating a sunset-dream effect. Large semi-transparent white overlay shapes (circles and blobs) at low opacity scattered across the gradient, creating a layered, dreamy depth. Product in the center with a soft white glow. Headline in white with a subtle text-shadow for legibility. Small translucent CTA pill.
Creative hook: The peach-to-lavender gradient is inherently beauty-coded — it evokes skincare, makeup palettes, and feminine wellness. The translucent white overlays create depth like layers of silk or petals. Everything feels soft, diffused, and dreamlike. No hard edges anywhere.
Mood: Dreamy, ethereal, soft, beauty-forward, fantasy.`,
    campaignModifiers: {
      ramadan: `Gradient shifts to warm cream-to-gold. White overlays become gold-tinted. Add a crescent shape as one of the floating overlay elements. Warm spiritual dreaminess.`,
      eid: `Gradient becomes peach-to-warm-gold. Overlay shapes gain sparkle edges. Small starburst shapes mixed with the blobs. Festive dream.`,
    },
  },
];

// ── Recipe Pools Map ────────────────────────────────────────────

const RECIPE_POOLS: Record<Category, DesignRecipe[]> = {
  restaurant: RESTAURANT_RECIPES,
  supermarket: SUPERMARKET_RECIPES,
  ecommerce: ECOMMERCE_RECIPES,
  services: SERVICES_RECIPES,
  fashion: FASHION_RECIPES,
  beauty: BEAUTY_RECIPES,
};

// ── Selection Function ──────────────────────────────────────────

/**
 * Select `count` unique random recipes from the pool for a given category.
 * Ensures no recipe is repeated within a batch.
 */
// Recipes that are inherently seasonal and should not appear in standard campaigns
const SEASONAL_RECIPE_IDS = new Set([
  "r-islamic-arch",
  "r-elegant-frame",
  "o-ramadan-gold",
]);

export function selectRecipes(
  category: Category,
  count: number,
  campaignType: CampaignType = "standard"
): DesignRecipe[] {
  let pool = RECIPE_POOLS[category];

  // For standard campaigns, exclude inherently seasonal recipes
  if (campaignType === "standard") {
    pool = pool.filter((r) => !SEASONAL_RECIPE_IDS.has(r.id));
  }

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
