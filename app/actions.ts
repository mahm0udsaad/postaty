"use server";

import { generateText, experimental_generateImage as generateImage } from "ai";
import { gateway } from "@/lib/ai";
import { getSystemPrompt, buildUserMessage } from "@/lib/prompts";
import type { BrandKitPromptData } from "@/lib/prompts";
import { FORMAT_CONFIGS } from "@/lib/constants";
import { postFormDataSchema } from "@/lib/validation";
import type { PostFormData, GenerationResult } from "@/lib/types";

function getImages(data: PostFormData): string[] {
  const images: string[] = [];
  switch (data.category) {
    case "restaurant":
      images.push(data.mealImage, data.logo);
      break;
    case "supermarket":
      images.push(...data.productImages, data.logo);
      break;
    case "online":
      images.push(data.productImage, data.logo);
      break;
  }
  return images;
}

function getBusinessName(data: PostFormData): string {
  switch (data.category) {
    case "restaurant":
      return data.restaurantName;
    case "supermarket":
      return data.supermarketName;
    case "online":
      return data.shopName;
  }
}

function getProductName(data: PostFormData): string {
  switch (data.category) {
    case "restaurant":
      return data.mealName;
    case "supermarket":
      return data.productName;
    case "online":
      return data.productName;
  }
}

export async function generatePoster(
  data: PostFormData,
  brandKit?: BrandKitPromptData
): Promise<{
  results: GenerationResult[];
  prompt: string;
  businessName: string;
  productName: string;
}> {
  // Step 0: Validate input server-side
  const validation = postFormDataSchema.safeParse(data);
  if (!validation.success) {
    const errors = validation.error.issues
      .map((issue) => issue.message)
      .join(", ");
    throw new Error(`Validation failed: ${errors}`);
  }

  // Step 1: Craft the image generation prompt using GPT-4o (with brand kit if provided)
  const systemPrompt = getSystemPrompt(data, brandKit);
  const userMessage = buildUserMessage(data);

  const { text: craftedPrompt } = await generateText({
    model: gateway("openai/gpt-4o"),
    system: systemPrompt,
    prompt: userMessage,
  });

  const results: GenerationResult[] = [];

  for (const format of data.formats) {
    const config = FORMAT_CONFIGS[format];

    try {
      // Use Google Imagen 4.0 for image generation
      const imagePrompt = `Using the provided images (product/meal photo and logo), create a professional ${config.aspectRatio} social media marketing poster.\n\n${craftedPrompt}\n\nIMPORTANT: Use the EXACT uploaded images in the poster - the meal/product photo and the logo. Do NOT generate new food images. The poster should have the aspect ratio ${config.aspectRatio}. Generate ONLY the image, no text response.`;

      const result = await generateImage({
        model: "google/gemini-2.5-flash-image" as any,
        prompt: imagePrompt,
        aspectRatio: config.aspectRatio as `${number}:${number}`,
      });

      if (result.image) {
        results.push({
          format,
          imageBase64: result.image.base64,
          status: "complete",
        });
      } else {
        results.push({
          format,
          imageBase64: "",
          status: "error",
          error: "لم يتم إنشاء صورة من النموذج",
        });
      }
    } catch (error) {
      console.error(`Error generating image for ${format}:`, error);
      results.push({
        format,
        imageBase64: "",
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ في إنشاء الصورة",
      });
    }
  }

  return {
    results,
    prompt: craftedPrompt,
    businessName: getBusinessName(data),
    productName: getProductName(data),
  };
}
