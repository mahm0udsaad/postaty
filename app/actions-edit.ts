"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { editDesign } from "@/lib/edit-design";
import { FORMAT_CONFIGS, MENU_FORMAT_CONFIG } from "@/lib/constants";
import { getSharp } from "@/lib/image-helpers";
import { uploadBase64ToStorage, getPublicUrl } from "@/lib/supabase-upload";
import { randomUUID } from "crypto";
import type { OutputFormat } from "@/lib/types";
import { checkRateLimit } from "@/lib/rate-limit";

export type EditDesignResult =
  | { status: "complete"; imageBase64: string; publicUrl?: string }
  | { status: "error"; error: string; errorType: "auth" | "rate_limit" | "validation" | "quota" | "capacity" | "generation" };

export async function editDesignAction(
  imageBase64: string,
  editPrompt: string,
  format: OutputFormat | "menu",
  model: "edit" | "free" = "edit",
  generationId?: string
): Promise<EditDesignResult> {
  // Auth gate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    return { status: "error", error: "يجب تسجيل الدخول لتعديل التصاميم", errorType: "auth" };
  }

  // Rate limit
  const { allowed } = await checkRateLimit(userId, "edit", 60, 5);
  if (!allowed) {
    return { status: "error", error: "لقد تجاوزت الحد المسموح. حاول مرة أخرى بعد دقيقة.", errorType: "rate_limit" };
  }

  // Validate inputs
  if (!editPrompt || editPrompt.trim().length === 0) {
    return { status: "error", error: "يرجى إدخال تعليمات التعديل", errorType: "validation" };
  }

  if (!imageBase64 || !imageBase64.startsWith("data:image/")) {
    return { status: "error", error: "صورة غير صالحة", errorType: "validation" };
  }

  // Resolve format config
  const formatConfig = format === "menu"
    ? MENU_FORMAT_CONFIG
    : FORMAT_CONFIGS[format];

  if (!formatConfig) {
    return { status: "error", error: "تنسيق غير صالح", errorType: "validation" };
  }

  console.info("[editDesignAction] start", { userId, format, promptLength: editPrompt.length });

  try {
    const result = await editDesign({
      imageBase64,
      editPrompt: editPrompt.trim(),
      aspectRatio: formatConfig.aspectRatio,
      width: formatConfig.width,
      height: formatConfig.height,
      model,
      // Menu images are A4 with many small text elements — use a larger input size
      // so the model can read item names, prices, and descriptions accurately.
      inputMaxPx: format === "menu" ? 1024 : 512,
    });

    // Upload to storage + update DB in parallel (server-side, no extra round-trip)
    let publicUrl: string | undefined;
    if (generationId) {
      try {
        const path = `${userId}/poster-edited_${randomUUID()}.png`;
        const storagePath = await uploadBase64ToStorage(result.imageBase64, "generations", path);
        publicUrl = getPublicUrl("generations", storagePath);

        const admin = createAdminClient();
        await admin
          .from("generations")
          .update({ outputs: [{ format, url: publicUrl }] })
          .eq("id", generationId);
      } catch (uploadErr) {
        console.error("[editDesignAction] failed to persist to history", uploadErr);
      }
    }

    return { status: "complete", imageBase64: result.imageBase64, publicUrl };
  } catch (err) {
    console.error("[editDesignAction] failed", err);
    const errorMessage = err instanceof Error ? err.message : "Edit failed";
    let errorType: EditDesignResult & { status: "error" } extends { errorType: infer T } ? T : never = "generation";
    if (/quota|exceeded.*quota|429|resource exhausted/i.test(errorMessage)) {
      errorType = "quota";
    } else if (/capacity|overloaded|503|high demand/i.test(errorMessage)) {
      errorType = "capacity";
    }

    return { status: "error", error: errorMessage, errorType };
  }
}

export async function resizeImageAction(
  imageBase64: string,
  targetFormat: OutputFormat
): Promise<{ status: "complete"; imageBase64: string } | { status: "error"; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { status: "error", error: "يجب تسجيل الدخول" };

  const formatConfig = FORMAT_CONFIGS[targetFormat];
  if (!formatConfig) return { status: "error", error: "تنسيق غير صالح" };

  const match = imageBase64.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return { status: "error", error: "صورة غير صالحة" };

  try {
    const raw = Buffer.from(match[2], "base64");
    const sharp = await getSharp();
    const resizedBuffer = await sharp(raw)
      .resize(formatConfig.width, formatConfig.height, { fit: "fill" })
      .jpeg({ quality: 90 })
      .toBuffer();
    return { status: "complete", imageBase64: `data:image/jpeg;base64,${resizedBuffer.toString("base64")}` };
  } catch (err) {
    console.error("[resizeImageAction] failed", err);
    return { status: "error", error: "فشل تغيير الحجم" };
  }
}
