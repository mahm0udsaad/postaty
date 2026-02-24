import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateSpeech } from "@/lib/elevenlabs";
import { VOICE_PRESETS, REEL_CONFIG } from "@/lib/constants";

// In-memory cache of preview URLs to avoid re-generating
const previewCache = new Map<string, string>();

// Short preview text per language
const PREVIEW_TEXT: Record<string, string> = {
  ar: "مرحباً، أنا صوتك الإعلاني. اكتشف عروضنا الحصرية الآن!",
  en: "Hello, I'm your ad voice. Discover our exclusive offers now!",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const voiceId = searchParams.get("voiceId");

  if (!voiceId) {
    return NextResponse.json({ error: "voiceId required" }, { status: 400 });
  }

  // Validate voice ID is one of our presets
  const voice = VOICE_PRESETS.find((v) => v.id === voiceId);
  if (!voice) {
    return NextResponse.json({ error: "Invalid voiceId" }, { status: 400 });
  }

  // Check in-memory cache
  if (previewCache.has(voiceId)) {
    return NextResponse.json({ previewUrl: previewCache.get(voiceId) });
  }

  // Check if already stored in Supabase Storage
  const admin = createAdminClient();
  const storagePath = `voice-previews/${voiceId}.mp3`;

  const { data: existingUrl } = admin.storage
    .from("reels")
    .getPublicUrl(storagePath);

  // Check if the file actually exists by trying to download its info
  const { data: fileInfo } = await admin.storage
    .from("reels")
    .list("voice-previews", { search: `${voiceId}.mp3` });

  if (fileInfo && fileInfo.length > 0) {
    const url = existingUrl.publicUrl;
    previewCache.set(voiceId, url);
    return NextResponse.json({ previewUrl: url });
  }

  // Generate preview audio using ElevenLabs TTS
  try {
    const text = PREVIEW_TEXT[voice.language] || PREVIEW_TEXT.ar;
    const audioBuffer = await generateSpeech(text, voiceId, REEL_CONFIG.ttsModel);

    // Upload to Supabase Storage
    const { error: uploadError } = await admin.storage
      .from("reels")
      .upload(storagePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("[voices/preview] Upload failed:", uploadError);
      return NextResponse.json({ error: "Failed to store preview" }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage
      .from("reels")
      .getPublicUrl(storagePath);

    const previewUrl = publicUrlData.publicUrl;
    previewCache.set(voiceId, previewUrl);

    return NextResponse.json({ previewUrl });
  } catch (err: any) {
    console.error("[voices/preview] TTS failed:", err.message);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
