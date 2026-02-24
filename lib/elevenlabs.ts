/**
 * ElevenLabs Text-to-Speech API integration.
 * Uses direct fetch (no SDK) for simplicity — single endpoint usage.
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export class ElevenLabsError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public detail?: string
  ) {
    super(message);
    this.name = "ElevenLabsError";
  }
}

/**
 * Generate speech audio from text using ElevenLabs TTS API.
 * Returns an MP3 audio buffer.
 */
export async function generateSpeech(
  text: string,
  voiceId: string,
  model: string = "eleven_multilingual_v2"
): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new ElevenLabsError("ELEVENLABS_API_KEY is not configured");
  }

  const url = `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errorBody = await response.json();
      detail = errorBody?.detail?.message || errorBody?.detail || JSON.stringify(errorBody);
    } catch {
      detail = await response.text().catch(() => "");
    }

    throw new ElevenLabsError(
      `ElevenLabs TTS failed with status ${response.status}`,
      response.status,
      detail
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Get the preview URL for a voice from ElevenLabs API.
 * Works on free plans (unlike TTS generation with library voices).
 */
export async function getVoicePreviewUrl(voiceId: string): Promise<string | null> {
  if (!ELEVENLABS_API_KEY) {
    throw new ElevenLabsError("ELEVENLABS_API_KEY is not configured");
  }

  const url = `${ELEVENLABS_BASE_URL}/voices/${voiceId}`;

  const response = await fetch(url, {
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errorBody = await response.json();
      detail = errorBody?.detail?.message || errorBody?.detail || JSON.stringify(errorBody);
    } catch {
      detail = await response.text().catch(() => "");
    }
    throw new ElevenLabsError(
      `ElevenLabs voice lookup failed with status ${response.status}`,
      response.status,
      detail
    );
  }

  const voice = await response.json();
  return voice.preview_url || null;
}

/**
 * List all voices available to the current API key.
 */
export async function listVoices(): Promise<any[]> {
  if (!ELEVENLABS_API_KEY) {
    throw new ElevenLabsError("ELEVENLABS_API_KEY is not configured");
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
  });

  if (!response.ok) {
    throw new ElevenLabsError(`Failed to list voices: ${response.status}`, response.status);
  }

  const data = await response.json();
  return data.voices || [];
}
