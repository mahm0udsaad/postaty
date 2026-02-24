import { renderMediaOnLambda, getRenderProgress } from "@remotion/lambda/client";
import type { AwsRegion } from "@remotion/lambda";
import type { AnimationSpec } from "@/remotion/src/types/animation-spec";

const FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME!;
const SERVE_URL = process.env.REMOTION_SERVE_URL!;
const REGION = (process.env.REMOTION_AWS_REGION || "us-east-1") as AwsRegion;

/**
 * Start a reel render on Remotion Lambda.
 * Returns the renderId for polling progress.
 */
export async function startReelRender(
  spec: AnimationSpec,
  sourceImageUrl: string,
  images?: { poster?: string; logo?: string; product?: string },
  audioUrl?: string
): Promise<{ renderId: string; bucketName: string }> {
  const { renderId, bucketName } = await renderMediaOnLambda({
    region: REGION,
    functionName: FUNCTION_NAME,
    serveUrl: SERVE_URL,
    composition: "Reel",
    inputProps: { spec, sourceImageUrl, ...(images && { images }), ...(audioUrl && { audioUrl }) },
    codec: "h264",
    imageFormat: "jpeg",
    maxRetries: 1,
    framesPerLambda: 40,
    privacy: "public",
    downloadBehavior: { type: "download", fileName: "reel.mp4" },
  });

  return { renderId, bucketName };
}

/**
 * Check the progress of a Lambda render.
 */
export async function checkRenderProgress(
  renderId: string,
  bucketName: string
): Promise<{
  done: boolean;
  progress: number;
  outputUrl?: string;
  outputSize?: number;
  error?: string;
}> {
  const progress = await getRenderProgress({
    region: REGION,
    functionName: FUNCTION_NAME,
    renderId,
    bucketName,
  });

  if (progress.fatalErrorEncountered) {
    return {
      done: true,
      progress: 1,
      error:
        progress.errors?.[0]?.message || "Render failed with unknown error",
    };
  }

  if (progress.done && progress.outputFile) {
    return {
      done: true,
      progress: 1,
      outputUrl: progress.outputFile,
      outputSize: progress.outputSizeInBytes ?? undefined,
    };
  }

  return {
    done: false,
    progress: progress.overallProgress,
  };
}
