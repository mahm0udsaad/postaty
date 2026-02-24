/**
 * System and user prompts for AI-driven reel animation spec generation.
 * The AI analyzes a poster image and outputs structured JSON (AnimationSpec),
 * NOT executable code. Our fixed Remotion compositions interpret the JSON.
 */

export function getReelAnimationSystemPrompt(availableImages?: {
  hasLogo: boolean;
  hasProduct: boolean;
}): string {
  const hasLogo = availableImages?.hasLogo ?? false;
  const hasProduct = availableImages?.hasProduct ?? false;

  // Build the sourceId documentation based on what's available
  const sourceIdValues = ['"poster"'];
  if (hasLogo) sourceIdValues.push('"logo"');
  if (hasProduct) sourceIdValues.push('"product"');
  const sourceIdEnum = sourceIdValues.join(" | ");

  const sourceIdDocs = [
    '    - "poster": The full marketing poster (always available) — the main hero image. Rendered with objectFit: "contain" so the FULL design is always visible. Use scale 1.0 to show it fully, or 1.05-1.1 for very subtle motion.',
  ];
  if (hasLogo) {
    sourceIdDocs.push(
      '    - "logo": The brand logo (provided) — use for intro brand reveal or CTA segment. Rendered with contain mode so it won\'t be stretched'
    );
  }
  if (hasProduct) {
    sourceIdDocs.push(
      '    - "product": The standalone product/meal/service photo (provided) — rendered with objectFit: "cover" for dramatic close-ups. Use scale 1.0-1.3 for zoom effects.'
    );
  }

  const imageDesignRules: string[] = [];
  if (hasLogo) {
    imageDesignRules.push(
      '17. When a logo is available, include a logo reveal in the intro or CTA segment using sourceId: "logo" with a "scale-in" or "fade-in" effect at moderate scale (0.8-1.1). Position it near center for intro or top-center for CTA.',
    );
  }
  if (hasProduct) {
    imageDesignRules.push(
      `${hasLogo ? "18" : "17"}. When a product image is available, dedicate one segment to a product close-up using sourceId: "product" — great for a dramatic reveal before the CTA. Product images use "cover" mode so you can use more aggressive scales (1.0-1.3).`,
    );
  }

  return `You are an expert motion graphics designer who creates stunning Instagram Reels from marketing images.

Given marketing images, analyze their visual elements (product image, text, logo, colors, layout) and create an animation specification that turns them into an engaging 8-10 second vertical video (1080x1920, 30fps).

OUTPUT FORMAT: You must output ONLY valid JSON matching the AnimationSpec schema. No markdown, no explanation, no code fences. Just raw JSON.

SCHEMA:
{
  "durationInFrames": number (240-300, for 8-10 seconds at 30fps),
  "fps": 30,
  "width": 1080,
  "height": 1920,
  "backgroundColor": string (hex color extracted from poster's dominant background color),
  "segments": [
    {
      "id": string (unique, e.g. "intro", "reveal", "details", "cta"),
      "startFrame": number,
      "durationInFrames": number,
      "layers": [
        // ImageLayer - source images with motion effects
        {
          "type": "image",
          "sourceId": ${sourceIdEnum},
          "effect": "ken-burns-in" | "ken-burns-out" | "zoom-in" | "zoom-out" | "pan-left" | "pan-right" | "pan-up" | "pan-down" | "fade-in" | "static",
          "startScale": number (0.95-1.15 for poster, 0.8-1.3 for product),
          "endScale": number (0.95-1.15 for poster, 0.8-1.3 for product),
          "position": { "x": 0.5, "y": 0.5 },
          "opacity": { "start": number (0-1), "end": number (0-1) },
          "easing": "linear" | "ease-in" | "ease-out" | "ease-in-out" | "spring"
        },
        // TextLayer - overlay text animations
        {
          "type": "text",
          "content": string (short, punchy text — NOT duplicating poster text),
          "fontFamily": "Noto Kufi Arabic" | "Inter" | "Tajawal",
          "fontSize": number (24-80),
          "fontWeight": 400 | 600 | 700 | 800,
          "color": string (hex),
          "position": { "x": number (0-1), "y": number (0-1) },
          "alignment": "center" | "right" | "left",
          "entrance": "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale-in" | "typewriter" | "none",
          "exit": "fade-out" | "scale-out" | "none",
          "entranceDelay": number (frames, 0-30),
          "shadow": { "color": string, "blur": number, "x": number, "y": number } (optional)
        },
        // ShapeLayer - decorative elements
        {
          "type": "shape",
          "shape": "circle" | "rectangle" | "line",
          "color": string (hex),
          "position": { "x": number (0-1), "y": number (0-1) },
          "size": { "width": number, "height": number },
          "opacity": { "start": number (0-1), "end": number (0-1) },
          "entrance": "scale-in" | "fade-in" | "draw" | "none",
          "borderRadius": number (optional)
        },
        // GradientOverlayLayer - gradient effects for text readability
        {
          "type": "gradient-overlay",
          "colors": [string, string] (hex, e.g. ["#00000000", "#000000CC"]),
          "direction": "top" | "bottom" | "left" | "right",
          "opacity": { "start": number (0-1), "end": number (0-1) }
        }
      ]
    }
  ],
  "voiceover": {
    "script": string (short ad narration script, 2-3 punchy sentences),
    "language": "ar" | "en"
  }
}

IMAGE SOURCES:
${sourceIdDocs.join("\n")}
    - Default to "poster" if unsure. Every image layer MUST include a "sourceId" field.

CRITICAL RENDERING FACTS:
- The video is 1080x1920 (9:16 portrait). The poster might be square (1080x1080) or any other ratio.
- Poster images are rendered with objectFit: "contain" — the full design is always visible with background color filling empty areas.
- NEVER use startScale or endScale above 1.15 for poster images — it will clip important content.
- position {x: 0.5, y: 0.5} = centered. ALWAYS center poster images.
- The background color fills areas not covered by the poster, so PICK A GOOD backgroundColor from the poster's dominant color.

ANIMATION DESIGN RULES:
1. Create 3-5 segments. Each segment should have a distinct visual purpose and feel different from the others.
2. Segment 1 (intro, ~2s / 60 frames): Build anticipation. Use a gradient or solid background + an animated text teaser OR a logo reveal. Do NOT show the poster yet.
3. Segment 2 (reveal, ~2.5s / 75 frames): The hero moment — fade-in or scale-in the full poster with a subtle slow zoom (1.0 → 1.05). This is the main payoff.
4. Segment 3 (hold/details, ~2s / 60 frames): Keep the poster visible with very subtle motion (static or gentle pan). Add a text overlay highlighting the key offer/price/discount ON TOP of the poster using a gradient overlay for readability.
5. Segment 4 (CTA, ~2s / 60 frames): End with a compelling call-to-action. Can show the poster at slight scale with a CTA text overlay, or transition to a solid color background with CTA text.${hasLogo ? " Include logo reveal here." : ""}${hasProduct ? " Or show a product close-up." : ""}
6. backgroundColor: Extract the dominant/primary background color from the poster (not a random color). This color will be visible in areas around the poster.
7. Arabic text: use "Noto Kufi Arabic" font, "right" alignment
8. English text: use "Inter" font, "center" alignment
9. Text overlays should ADD value, not duplicate. DO NOT re-create the poster's existing text. Instead use short hooks like: "عرض محدود" (Limited offer), "اطلب الآن" (Order now), the price/discount, or an emoji-style text.
10. Keep text font size 32-64 for overlays. Never go above 80.
11. Use smooth easing — "ease-in-out" for zooms, "ease-out" for entrances
12. Add gradient overlays (dark → transparent) behind text to ensure readability
13. Use shapes sparingly — thin accent lines, small circles for visual polish
14. Ensure segments don't overlap — each startFrame = previous startFrame + previous durationInFrames
15. Total frames across all segments MUST equal durationInFrames exactly
16. Make each segment feel visually distinct — vary the composition, not just the zoom level
${imageDesignRules.join("\n")}

COMMON MISTAKES TO AVOID:
- DO NOT just zoom into the poster for 10 seconds — that's boring and clips content
- DO NOT use startScale > 1.15 for poster images
- DO NOT duplicate text that already appears on the poster
- DO NOT position poster images off-center (always use position {x: 0.5, y: 0.5})
- DO NOT create segments without visual variety — each segment should feel different
- DO NOT forget the gradient overlay when placing text over images

VOICEOVER RULES:
- Always include a "voiceover" object in the root of the spec
- Write a short, punchy ad narration script (2-3 sentences) that matches the poster content
- The script should sound natural when read aloud — like a professional voiceover for a video ad
- For Arabic: keep under 25 words, use modern standard Arabic (فصحى مبسطة), match the poster tone
- For English: keep under 30 words, match the poster tone (promotional, warm, or urgent)
- The voiceover language MUST match the primary language provided in the context
- Include the business name and product/offer naturally in the script
- End with a call-to-action phrase`;
}

export function getReelAnimationUserPrompt(context: {
  businessName?: string;
  productName?: string;
  category?: string;
  language: "ar" | "en";
  availableImages?: { hasLogo: boolean; hasProduct: boolean };
}): string {
  const lang = context.language === "ar" ? "Arabic" : "English";

  const imageInfo: string[] = [];
  imageInfo.push("- Image 1: The generated marketing poster (sourceId: \"poster\") — show this FULLY, never crop it");
  if (context.availableImages?.hasLogo) {
    imageInfo.push(
      `- Image ${imageInfo.length + 1}: The brand logo (sourceId: "logo")`
    );
  }
  if (context.availableImages?.hasProduct) {
    imageInfo.push(
      `- Image ${imageInfo.length + 1}: The product/item photo (sourceId: "product") — can use for dramatic close-ups`
    );
  }

  return `Analyze the attached marketing poster and create an animation specification for an Instagram Reel.

Available images:
${imageInfo.join("\n")}

Context:
- Business: ${context.businessName || "Unknown"}
- Product/Service: ${context.productName || "Unknown"}
- Category: ${context.category || "general"}
- Primary language: ${lang}

IMPORTANT REQUIREMENTS:
1. The poster is the hero content — it must be shown FULLY (not cropped) in at least 2 segments
2. Create a storytelling arc: tease → reveal poster → highlight offer → call to action
3. Use the poster's dominant background color as backgroundColor so it blends nicely
4. Text overlays should complement the poster, not duplicate its text
5. Make it feel like a professional video ad, not just a zooming image${context.availableImages?.hasLogo ? "\n6. Use the logo for brand moments (intro or CTA)" : ""}${context.availableImages?.hasProduct ? `\n${context.availableImages?.hasLogo ? "7" : "6"}. Use the product image for an impactful close-up segment` : ""}

Output ONLY the JSON animation spec. No other text.`;
}
