import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";
import { uploadBase64ToStorage, getPublicUrl } from "@/lib/supabase-upload";
import { randomUUID } from "crypto";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { base64, bucket, prefix } = await request.json();

    if (!base64 || !bucket) {
      return NextResponse.json(
        { error: "Missing base64 or bucket" },
        { status: 400 }
      );
    }

    // Validate bucket name
    const allowedBuckets = ["generations", "logos", "showcase", "feedback", "previews", "avatars", "brand-kits"];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: "Invalid bucket" },
        { status: 400 }
      );
    }

    // Generate unique path
    const ext = "png";
    const filePrefix = prefix || "upload";
    const path = `${user.id}/${filePrefix}_${randomUUID()}.${ext}`;

    const storagePath = await uploadBase64ToStorage(base64, bucket, path);
    const publicUrl = getPublicUrl(bucket, storagePath);

    return NextResponse.json({ storagePath, publicUrl }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("[storage/upload] Error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
