import { NextResponse } from "next/server";
import { generateText } from "ai";
import { reelSpecModel } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth, requireCurrentUser } from "@/lib/supabase/auth-helpers";
import {
  getReelAnimationSystemPrompt,
  getReelAnimationUserPrompt,
} from "@/lib/reel-prompts";
import {
  validateAndSanitizeSpec,
  extractJsonFromResponse,
} from "@/lib/reel-spec-validator";
import { startReelRender } from "@/lib/remotion-lambda";
import { REEL_CONFIG } from "@/lib/constants";
import { generateSpeech } from "@/lib/elevenlabs";

const REEL_MODEL_ID = "gemini-3-flash-preview";

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const [user, currentUser] = await Promise.all([
      requireAuth(),
      requireCurrentUser(),
    ]);
    const admin = createAdminClient();

    // Parse request body
    const body = await request.json();
    const {
      generationId,
      sourceImageUrl,
      sourceImageBase64,
      logoUrl,
      logoBase64,
      productUrl,
      productBase64,
      businessName,
      productName,
      category,
      language = "ar",
      voiceId,
    } = body;

    if (!sourceImageUrl && !sourceImageBase64) {
      return NextResponse.json(
        { error: "sourceImageUrl or sourceImageBase64 is required" },
        { status: 400 }
      );
    }

    // ── Plan Gate ──────────────────────────────────────────────────
    const { data: billing } = await admin
      .from("billing")
      .select("*")
      .eq("user_auth_id", user.id)
      .single();

    if (!billing || billing.plan_key === "none") {
      return NextResponse.json(
        { error: "upgrade_required", planRequired: "starter" },
        { status: 403 }
      );
    }

    // Check subscription status
    if (
      ["past_due", "canceled", "unpaid", "incomplete_expired"].includes(
        billing.status
      )
    ) {
      return NextResponse.json(
        { error: "Subscription is not active" },
        { status: 403 }
      );
    }

    // ── Credit Check ───────────────────────────────────────────────
    const monthlyRemaining = Math.max(
      billing.monthly_credit_limit - billing.monthly_credits_used,
      0
    );
    const totalRemaining = monthlyRemaining + billing.addon_credits_balance;

    if (totalRemaining < REEL_CONFIG.creditsPerReel) {
      return NextResponse.json(
        { error: "insufficient_credits", required: REEL_CONFIG.creditsPerReel, available: totalRemaining },
        { status: 403 }
      );
    }

    // ── Consume Credits ────────────────────────────────────────────
    const idempotencyKey = `reel_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const creditRes = await fetch(
      new URL("/api/billing/consume-credit", request.url).toString(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          idempotencyKey,
          amount: REEL_CONFIG.creditsPerReel,
        }),
      }
    );

    const creditResult = await creditRes.json();
    if (!creditRes.ok || !creditResult.ok) {
      return NextResponse.json(
        { error: "Failed to consume credits" },
        { status: 403 }
      );
    }

    // ── Create reel_generations record ─────────────────────────────
    const { data: reelRecord, error: insertError } = await admin
      .from("reel_generations")
      .insert({
        org_id: currentUser.org_id,
        user_id: currentUser.id,
        generation_id: generationId || null,
        source_image_url: sourceImageUrl || "",
        status: "generating_spec",
        credits_charged: REEL_CONFIG.creditsPerReel,
        ai_model: REEL_MODEL_ID,
        created_at: Date.now(),
      })
      .select("id")
      .single();

    if (insertError || !reelRecord) {
      console.error("[reels/generate] Failed to create record:", insertError);
      return NextResponse.json(
        { error: "Failed to create reel record" },
        { status: 500 }
      );
    }

    const reelId = reelRecord.id;

    // ── Resolve asset URLs for Lambda (upload base64 → Supabase) ──
    const hasLogo = !!(logoBase64 || logoUrl);
    const hasProduct = !!(productBase64 || productUrl);

    async function uploadBase64ForLambda(
      base64: string | undefined,
      existingUrl: string | undefined,
      prefix: string
    ): Promise<string | undefined> {
      if (existingUrl) return existingUrl;
      if (!base64) return undefined;
      try {
        const uploadRes = await fetch(
          new URL("/api/storage/upload", request.url).toString(),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              cookie: request.headers.get("cookie") || "",
            },
            body: JSON.stringify({ base64, bucket: "reels", prefix }),
          }
        );
        if (!uploadRes.ok) return undefined;
        const { publicUrl } = await uploadRes.json();
        return publicUrl as string;
      } catch {
        return undefined;
      }
    }

    const [resolvedLogoUrl, resolvedProductUrl] = await Promise.all([
      uploadBase64ForLambda(logoBase64, logoUrl, "logo"),
      uploadBase64ForLambda(productBase64, productUrl, "product"),
    ]);

    // ── Call Gemini to generate animation spec ─────────────────────
    try {
      const availableImages = { hasLogo, hasProduct };
      const systemPrompt = getReelAnimationSystemPrompt(availableImages);
      const userPrompt = getReelAnimationUserPrompt({
        businessName,
        productName,
        category,
        language,
        availableImages,
      });

      // Build content parts — send all available images to Gemini
      const contentParts: Array<
        | { type: "text"; text: string }
        | { type: "image"; image: string | Buffer; mediaType?: string }
      > = [];

      // Image 1: Poster (always)
      if (sourceImageBase64) {
        const base64Data = sourceImageBase64.includes(",")
          ? sourceImageBase64.split(",")[1]
          : sourceImageBase64;
        contentParts.push({
          type: "image",
          image: Buffer.from(base64Data, "base64"),
          mediaType: "image/png",
        });
      } else if (sourceImageUrl) {
        contentParts.push({
          type: "image",
          image: sourceImageUrl,
        });
      }

      // Image 2: Logo (if available)
      if (logoBase64) {
        const b64 = logoBase64.includes(",") ? logoBase64.split(",")[1] : logoBase64;
        contentParts.push({
          type: "image",
          image: Buffer.from(b64, "base64"),
          mediaType: "image/png",
        });
      } else if (resolvedLogoUrl) {
        contentParts.push({
          type: "image",
          image: resolvedLogoUrl,
        });
      }

      // Image 3: Product (if available)
      if (productBase64) {
        const b64 = productBase64.includes(",") ? productBase64.split(",")[1] : productBase64;
        contentParts.push({
          type: "image",
          image: Buffer.from(b64, "base64"),
          mediaType: "image/png",
        });
      } else if (resolvedProductUrl) {
        contentParts.push({
          type: "image",
          image: resolvedProductUrl,
        });
      }

      contentParts.push({ type: "text", text: userPrompt });

      const result = await generateText({
        model: reelSpecModel,
        system: systemPrompt,
        messages: [{ role: "user", content: contentParts }],
      });

      const aiDurationMs = Date.now() - startTime;

      // Parse and validate the animation spec
      const rawJson = extractJsonFromResponse(result.text);
      const spec = validateAndSanitizeSpec(rawJson);

      // ── Update DB spec + Generate TTS in parallel ─────────────────
      const specUpdatePromise = admin
        .from("reel_generations")
        .update({
          animation_spec: spec,
          status: voiceId ? "generating_audio" : "rendering",
          ai_input_tokens: result.usage?.inputTokens ?? 0,
          ai_output_tokens: result.usage?.outputTokens ?? 0,
          ai_duration_ms: aiDurationMs,
          duration_seconds: spec.durationInFrames / spec.fps,
          ...(voiceId && { voice_id: voiceId }),
          ...(spec.voiceover?.script && { voiceover_script: spec.voiceover.script }),
        })
        .eq("id", reelId);

      const ttsPromise = (async (): Promise<string | undefined> => {
        if (!voiceId || !spec.voiceover?.script) return undefined;
        try {
          console.log("[reels/generate] Generating voiceover audio...", {
            voiceId,
            scriptLength: spec.voiceover.script.length,
          });

          const audioBuffer = await generateSpeech(
            spec.voiceover.script,
            voiceId,
            REEL_CONFIG.ttsModel
          );

          // Upload MP3 to Supabase Storage
          const audioFileName = `audio/${reelId}-${Date.now()}.mp3`;
          const { error: uploadError } = await admin.storage
            .from("reels")
            .upload(audioFileName, audioBuffer, {
              contentType: "audio/mpeg",
              upsert: false,
            });

          if (uploadError) {
            console.error("[reels/generate] Audio upload failed:", uploadError);
            return undefined;
          }

          const { data: publicUrlData } = admin.storage
            .from("reels")
            .getPublicUrl(audioFileName);
          const url = publicUrlData.publicUrl;

          // Update record with audio info
          await admin
            .from("reel_generations")
            .update({
              audio_url: url,
              audio_storage_path: audioFileName,
              status: "rendering",
            })
            .eq("id", reelId);

          console.log("[reels/generate] Voiceover audio generated:", url);
          return url;
        } catch (ttsError: any) {
          // Graceful degradation: continue without audio
          console.error("[reels/generate] TTS failed (continuing without audio):", ttsError.message);
          await admin
            .from("reel_generations")
            .update({ status: "rendering" })
            .eq("id", reelId);
          return undefined;
        }
      })();

      const [, audioUrl] = await Promise.all([specUpdatePromise, ttsPromise]);

      // ── Start Remotion Lambda render ───────────────────────────────
      const posterUrl = sourceImageUrl || "";
      const imagesMap: Record<string, string> = { poster: posterUrl };
      if (resolvedLogoUrl) imagesMap.logo = resolvedLogoUrl;
      if (resolvedProductUrl) imagesMap.product = resolvedProductUrl;

      const { renderId, bucketName } = await startReelRender(spec, posterUrl, imagesMap, audioUrl);

      await admin
        .from("reel_generations")
        .update({
          remotion_render_id: renderId,
          // Store bucket name in a metadata field for polling
          animation_spec: { ...spec, _remotionBucket: bucketName },
        })
        .eq("id", reelId);

      // ── Track AI usage (fire-and-forget) ──────────────────────────
      admin.from("ai_usage_events").insert({
        user_auth_id: user.id,
        model: REEL_MODEL_ID,
        route: "reel",
        input_tokens: result.usage?.inputTokens ?? 0,
        output_tokens: result.usage?.outputTokens ?? 0,
        images_generated: 0,
        duration_ms: aiDurationMs,
        success: true,
        created_at: Date.now(),
      }).then(({ error }) => {
        if (error) console.error("[reels/generate] Failed to track usage:", error);
      });

      return NextResponse.json({
        reelId,
        status: "rendering",
        renderId,
      });
    } catch (aiError: any) {
      console.error("[reels/generate] AI generation failed:", aiError);

      // Update record to error state
      await admin
        .from("reel_generations")
        .update({
          status: "error",
          error: aiError.message || "AI generation failed",
          error_step: "generating_spec",
          ai_duration_ms: Date.now() - startTime,
        })
        .eq("id", reelId);

      // Track failed usage (fire-and-forget)
      admin.from("ai_usage_events").insert({
        user_auth_id: user.id,
        model: REEL_MODEL_ID,
        route: "reel",
        input_tokens: 0,
        output_tokens: 0,
        images_generated: 0,
        duration_ms: Date.now() - startTime,
        success: false,
        error: aiError.message || "AI generation failed",
        created_at: Date.now(),
      }).then(() => {});

      return NextResponse.json(
        { reelId, error: "AI generation failed", status: "error" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("[reels/generate] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
