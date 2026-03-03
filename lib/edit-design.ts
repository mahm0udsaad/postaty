"use server";

import { generateText } from "ai";
import { editImageModel } from "@/lib/ai";
import { buildImageProviderOptions, getSharp } from "./image-helpers";

const EDIT_MODEL_ID = "gemini-3.1-flash-image-preview";

const EDIT_SYSTEM_PROMPT = `You are a professional image editor. You receive a designed marketing poster/menu image and a user edit request.

RULES:
- Apply ONLY the specific change the user requests.
- Preserve the overall layout, text content, branding, logos, and composition.
- Do NOT add new elements unless explicitly asked.
- Do NOT remove elements unless explicitly asked.
- Keep the same image dimensions and aspect ratio.
- Maintain professional quality and visual consistency.
- If the user writes in Arabic, understand the request but apply it to the image.`;

export async function editDesign(input: {
  imageBase64: string;
  editPrompt: string;
  aspectRatio: string;
  width: number;
  height: number;
}): Promise<{ imageBase64: string }> {
  const { imageBase64, editPrompt, aspectRatio, width, height } = input;

  // Decode base64 data URL → Buffer
  const match = imageBase64.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data URL");
  }
  const imageBuffer = Buffer.from(match[2], "base64");
  const mediaType = match[1];

  const contentParts: Array<
    | { type: "image"; image: Buffer; mediaType: string }
    | { type: "text"; text: string }
  > = [
    { type: "image" as const, image: imageBuffer, mediaType },
    {
      type: "text" as const,
      text: `Edit this image according to the following instruction:\n\n${editPrompt}`,
    },
  ];

  const startTime = Date.now();

  const result = await generateText({
    model: editImageModel,
    providerOptions: buildImageProviderOptions(
      aspectRatio,
      Math.max(width, height) > 1080 ? "2K" : "1K"
    ),
    system: EDIT_SYSTEM_PROMPT,
    messages: [{ role: "user" as const, content: contentParts }],
  });

  const durationMs = Date.now() - startTime;

  const imageFile = result.files?.find((f) => f.mediaType?.startsWith("image/"));
  if (!imageFile) {
    console.error("[editDesign] no image in response", {
      filesCount: result.files?.length ?? 0,
      textSnippet: result.text?.slice(0, 200),
    });
    throw new Error("Edit model did not return an image");
  }

  // Resize to exact target dimensions
  const sharp = await getSharp();
  const resizedBuffer = await sharp(Buffer.from(imageFile.uint8Array))
    .resize(width, height, { fit: "fill" })
    .jpeg({ quality: 90 })
    .toBuffer();

  const base64 = resizedBuffer.toString("base64");
  const base64DataUrl = `data:image/jpeg;base64,${base64}`;

  console.info("[editDesign] success", {
    model: EDIT_MODEL_ID,
    durationMs,
    inputTokens: result.usage?.inputTokens ?? 0,
    outputTokens: result.usage?.outputTokens ?? 0,
  });

  return { imageBase64: base64DataUrl };
}
