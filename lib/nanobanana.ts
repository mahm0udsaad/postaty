"use server";

// ── NanoBanana Pro API Client ─────────────────────────────────────

const API_BASE = "https://api.nanobananaapi.ai/api/v1/nanobanana";
const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_MS = 300_000;

interface GenerateProRequest {
  prompt: string;
  imageUrls?: string[];
  resolution?: "1K" | "2K" | "4K";
  aspectRatio?: string;
}

interface TaskResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
  };
}

interface RecordInfoResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    successFlag: number; // 0=GENERATING, 1=SUCCESS, 2=CREATE_TASK_FAILED, 3=GENERATE_FAILED
    response?: {
      originImageUrl: string;
      resultImageUrl: string;
    };
    errorMessage?: string;
  };
}

function getApiKey(): string {
  const key = process.env.NANO_BANANA_API_KEY;
  if (!key) throw new Error("NANO_BANANA_API_KEY is not set");
  return key;
}

/** Submit a NanoBanana Pro image generation task */
async function submitTask(req: GenerateProRequest): Promise<string> {
  const res = await fetch(`${API_BASE}/generate-pro`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: req.prompt,
      type: "TEXTTOIAMGE",
      numImages: 1,
      ...(req.imageUrls && { imageUrls: req.imageUrls }),
      ...(req.resolution && { resolution: req.resolution }),
      ...(req.aspectRatio && { aspectRatio: req.aspectRatio }),
    }),
  });

  if (!res.ok) {
    throw new Error(`NanoBanana API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as TaskResponse;
  if (json.code !== 200) {
    throw new Error(`NanoBanana API error: ${json.message}`);
  }

  return json.data.taskId;
}

/** Poll for task completion and return the result image URL */
async function pollTask(taskId: string): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < MAX_POLL_MS) {
    const res = await fetch(
      `${API_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`NanoBanana poll error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as RecordInfoResponse;

    switch (json.data.successFlag) {
      case 1: {
        // SUCCESS
        const imageUrl = json.data.response?.resultImageUrl;
        if (!imageUrl) throw new Error("NanoBanana returned success but no image URL");
        return imageUrl;
      }
      case 2:
        throw new Error(`NanoBanana task creation failed: ${json.data.errorMessage ?? "unknown"}`);
      case 3:
        throw new Error(`NanoBanana generation failed: ${json.data.errorMessage ?? "unknown"}`);
      case 0:
        // Still generating — wait and retry
        break;
      default:
        throw new Error(`NanoBanana unknown status: ${json.data.successFlag}`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("NanoBanana generation timed out");
}

/** Download an image URL and return it as a base64 data URL */
async function imageUrlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "image/png";
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

/** Generate an image using NanoBanana Pro and return base64 data URL */
export async function generateNanoBananaImage(
  prompt: string,
  options?: { resolution?: "1K" | "2K" | "4K"; aspectRatio?: string }
): Promise<string> {
  console.info("[nanobanana] submitting task");
  const taskId = await submitTask({
    prompt,
    resolution: options?.resolution ?? "1K",
    aspectRatio: options?.aspectRatio ?? "1:1",
  });

  console.info("[nanobanana] polling task", { taskId });
  const imageUrl = await pollTask(taskId);

  console.info("[nanobanana] downloading result image");
  return imageUrlToBase64(imageUrl);
}
