import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGateway } from "@ai-sdk/gateway";

const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!googleApiKey) {
  throw new Error(
    "Missing GOOGLE_GENERATIVE_AI_API_KEY. Configure it in your environment."
  );
}

const google = createGoogleGenerativeAI({
  apiKey: googleApiKey,
});

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: process.env.AI_GATEWAY_URL,
});

/** Primary image model — Gemini 3 Pro Image via direct Google API */
export const primaryImageModel = google("gemini-3-pro-image-preview");

/** Fallback image model — same model routed through Vercel AI Gateway */
export const gatewayImageModel = gateway("google/gemini-3-pro-image-preview");

/** Free image model — Gemini 2.5 Flash Image */
export const freeImageModel = google("gemini-2.5-flash-image");

/** Reel animation spec model — Gemini 3.1 Pro Preview (text-only output, image input) */
export const reelSpecModel = google("gemini-3.1-pro-preview");

/** Marketing content model — Gemini 3 Flash with web search grounding */
export const marketingContentModel = google("gemini-3-flash-preview");

/** Pre-translation model — Gemini 2.5 Pro (best reasoning, accurate translations) */
export const translationModel = google("gemini-2.5-pro");

/** Edit image model — Gemini 3.1 Flash Image for fast image-to-image editing */
export const editImageModel = google("gemini-3.1-flash-image-preview");

/** Google provider instance for accessing tools (e.g. googleSearch) */
export { google };
