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
export const paidImageModel = google("gemini-3-pro-image-preview");

/** Free image model — Gemini 2.5 Flash Image */
export const freeImageModel = google("gemini-2.5-flash-image");

/** Reel animation spec model — Gemini 3 Flash Preview (text-only output, image input, faster) */
export const reelSpecModel = google("gemini-3-flash-preview");
