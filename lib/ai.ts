import { createGoogleGenerativeAI } from "@ai-sdk/google";

const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!googleApiKey) {
  throw new Error(
    "Missing GOOGLE_GENERATIVE_AI_API_KEY. Configure it in your environment."
  );
}

const google = createGoogleGenerativeAI({
  apiKey: googleApiKey,
});

/** Paid image model — Gemini 3 Pro Image Preview */
export const paidImageModel = google("gemini-3.1-flash-image-preview");

/** Free image model — Gemini 2.5 Flash Image */
export const freeImageModel = google("gemini-2.5-flash-image");

/** Reel animation spec model — Gemini 3.1 Pro Preview (text-only output, image input) */
export const reelSpecModel = google("gemini-3.1-pro-preview");

/** Marketing content model — Gemini 3 Flash with web search grounding */
export const marketingContentModel = google("gemini-3-flash-preview");

/** Pre-translation model — Gemini 2.5 Pro (best reasoning, accurate translations) */
export const translationModel = google("gemini-2.5-pro");

/** Google provider instance for accessing tools (e.g. googleSearch) */
export { google };
