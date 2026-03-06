"use server";

import { generateText } from "ai";
import { editImageModel, gatewayEditImageModel, freeImageModel } from "@/lib/ai";
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
  model?: "edit" | "free";
  inputMaxPx?: number;
}): Promise<{ imageBase64: string }> {
  const { imageBase64, editPrompt, aspectRatio, width, height, model = "edit", inputMaxPx = 512 } = input;
  const aiModel = model === "free" ? freeImageModel : gatewayEditImageModel;

  // Decode base64 data URL → Buffer
  const match = imageBase64.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data URL");
  }
  const imageBuffer = Buffer.from(match[2], "base64");

  // Compress input image before sending to the model.
  // Larger images (e.g. A4 menu) need a higher limit so small text stays readable.
  // Output is always re-generated at 1K by Gemini, then resized to target by Sharp.
  const sharp = await getSharp();
  const compressedInput = await sharp(imageBuffer)
    .resize(inputMaxPx, inputMaxPx, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();

  const contentParts: Array<
    | { type: "image"; image: Buffer; mediaType: string }
    | { type: "text"; text: string }
  > = [
    { type: "image" as const, image: compressedInput, mediaType: "image/jpeg" },
    {
      type: "text" as const,
      text: `Edit this image according to the following instruction:\n\n${editPrompt}`,
    },
  ];

  const startTime = Date.now();
  const editRequest = {
    providerOptions: buildImageProviderOptions(aspectRatio, "1K", "low"),
    system: EDIT_SYSTEM_PROMPT,
    messages: [{ role: "user" as const, content: contentParts }],
  };

  let result;
  try {
    result = await generateText({ model: aiModel, maxRetries: 0, abortSignal: AbortSignal.timeout(90_000), ...editRequest });
  } catch (primaryErr) {
    if (model !== "edit") throw primaryErr;
    console.warn("[editDesign] primary failed, falling back to direct", primaryErr instanceof Error ? primaryErr.message : primaryErr);
    result = await generateText({ model: editImageModel, ...editRequest });
  }

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
  const resizedBuffer = await sharp(Buffer.from(imageFile.uint8Array))
    .resize(width, height, { fit: "fill" })
    .jpeg({ quality: 90 })
    .toBuffer();

  const base64 = resizedBuffer.toString("base64");
  const base64DataUrl = `data:image/jpeg;base64,${base64}`;

  console.info("[editDesign] success", {
    model: model === "free" ? "gemini-2.5-flash-image" : EDIT_MODEL_ID,
    durationMs,
    inputTokens: result.usage?.inputTokens ?? 0,
    outputTokens: result.usage?.outputTokens ?? 0,
  });

  return { imageBase64: base64DataUrl };
}
