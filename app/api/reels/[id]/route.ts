import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/lib/supabase/auth-helpers";
import { checkRenderProgress } from "@/lib/remotion-lambda";
import { uploadBufferToStorage, getPublicUrl } from "@/lib/supabase-upload";
import { randomUUID } from "crypto";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireCurrentUser();
    const admin = createAdminClient();

    // Fetch reel record and verify ownership
    const { data: reel, error: fetchError } = await admin
      .from("reel_generations")
      .select("*")
      .eq("id", id)
      .eq("org_id", currentUser.org_id)
      .single();

    if (fetchError || !reel) {
      return NextResponse.json(
        { error: "Reel not found" },
        { status: 404 }
      );
    }

    // If currently rendering, check Remotion Lambda progress
    if (reel.status === "rendering" && reel.remotion_render_id) {
      const bucketName = reel.animation_spec?._remotionBucket;

      if (!bucketName) {
        return NextResponse.json({
          id: reel.id,
          status: reel.status,
          progress: 0,
          error: null,
        });
      }

      try {
        const progress = await checkRenderProgress(
          reel.remotion_render_id,
          bucketName
        );

        if (progress.done && progress.outputUrl) {
          // Download video from Remotion S3 and upload to Supabase Storage
          try {
            const videoRes = await fetch(progress.outputUrl);
            if (!videoRes.ok) throw new Error("Failed to fetch rendered video");

            const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
            const storagePath = `${currentUser.id}/reel_${randomUUID()}.mp4`;

            await uploadBufferToStorage(
              videoBuffer,
              "reels",
              storagePath,
              "video/mp4"
            );
            const publicUrl = getPublicUrl("reels", storagePath);

            // Update record to complete
            await admin
              .from("reel_generations")
              .update({
                status: "complete",
                video_url: publicUrl,
                video_storage_path: storagePath,
                render_duration_ms: Date.now() - reel.created_at,
                completed_at: Date.now(),
              })
              .eq("id", id);

            return NextResponse.json({
              id: reel.id,
              status: "complete",
              videoUrl: publicUrl,
              progress: 1,
              error: null,
            });
          } catch (uploadErr: any) {
            console.error("[reels/poll] Upload failed:", uploadErr);
            // Return the direct Remotion URL as fallback
            await admin
              .from("reel_generations")
              .update({
                status: "complete",
                video_url: progress.outputUrl,
                render_duration_ms: Date.now() - reel.created_at,
                completed_at: Date.now(),
              })
              .eq("id", id);

            return NextResponse.json({
              id: reel.id,
              status: "complete",
              videoUrl: progress.outputUrl,
              progress: 1,
              error: null,
            });
          }
        }

        if (progress.done && progress.error) {
          // Render failed
          await admin
            .from("reel_generations")
            .update({
              status: "error",
              error: progress.error,
              error_step: "rendering",
              render_duration_ms: Date.now() - reel.created_at,
            })
            .eq("id", id);

          return NextResponse.json({
            id: reel.id,
            status: "error",
            progress: 1,
            error: progress.error,
          });
        }

        // Still rendering
        return NextResponse.json({
          id: reel.id,
          status: "rendering",
          progress: progress.progress,
          error: null,
        });
      } catch (progressErr: any) {
        console.error("[reels/poll] Progress check failed:", progressErr);
        return NextResponse.json({
          id: reel.id,
          status: reel.status,
          progress: 0,
          error: null,
        });
      }
    }

    // Return current state for non-rendering statuses
    return NextResponse.json({
      id: reel.id,
      status: reel.status,
      videoUrl: reel.video_url,
      progress: reel.status === "complete" ? 1 : 0,
      error: reel.error,
    });
  } catch (error: any) {
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("[reels/poll] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
