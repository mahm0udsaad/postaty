import { NextResponse } from "next/server";
import { VOICE_PRESETS } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const voiceId = searchParams.get("voiceId");

  if (!voiceId) {
    return NextResponse.json({ error: "voiceId required" }, { status: 400 });
  }

  const voice = VOICE_PRESETS.find((v) => v.id === voiceId);
  if (!voice) {
    return NextResponse.json({ error: "Invalid voiceId" }, { status: 400 });
  }

  return NextResponse.json({ previewUrl: voice.previewUrl });
}
