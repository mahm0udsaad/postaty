"use server";

import { createClient } from "@/lib/supabase/server";
import { editDesign } from "@/lib/edit-design";
import { FORMAT_CONFIGS, MENU_FORMAT_CONFIG } from "@/lib/constants";
import type { OutputFormat } from "@/lib/types";

// Simple in-memory rate limiter: max 5 edits per minute per user
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const editRateLimitMap = new Map<string, number[]>();

function checkEditRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = editRateLimitMap.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    throw new Error("لقد تجاوزت الحد المسموح. حاول مرة أخرى بعد دقيقة.");
  }

  recent.push(now);
  editRateLimitMap.set(userId, recent);
}

export type EditDesignResult =
  | { status: "complete"; imageBase64: string }
  | { status: "error"; error: string; errorType: "auth" | "rate_limit" | "validation" | "quota" | "capacity" | "generation" };

export async function editDesignAction(
  imageBase64: string,
  editPrompt: string,
  format: OutputFormat | "menu"
): Promise<EditDesignResult> {
  // Auth gate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    return { status: "error", error: "يجب تسجيل الدخول لتعديل التصاميم", errorType: "auth" };
  }

  // Rate limit
  try {
    checkEditRateLimit(userId);
  } catch {
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
    });

    return { status: "complete", imageBase64: result.imageBase64 };
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
