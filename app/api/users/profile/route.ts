import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadBase64ToStorage, getPublicUrl } from "@/lib/supabase-upload";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const authUser = await requireAuth();
    const admin = createAdminClient();
    const body = await request.json();
    const { name, avatarBase64 } = body;

    const dbUpdates: Record<string, any> = {};
    const metadataUpdates: Record<string, any> = {};

    // Update name
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName.length > 100) {
        return NextResponse.json(
          { error: "Name must be 1-100 characters" },
          { status: 400 }
        );
      }
      dbUpdates.name = trimmedName;
      metadataUpdates.full_name = trimmedName;
      metadataUpdates.name = trimmedName;
    }

    // Upload avatar
    if (avatarBase64) {
      const path = `${authUser.id}/avatar_${randomUUID()}.jpg`;
      await uploadBase64ToStorage(avatarBase64, "avatars", path);
      const publicUrl = getPublicUrl("avatars", path);
      metadataUpdates.avatar_url = publicUrl;
      metadataUpdates.picture = publicUrl;
    }

    // Update DB user record
    if (Object.keys(dbUpdates).length > 0) {
      const { error: dbError } = await admin
        .from("users")
        .update(dbUpdates)
        .eq("auth_id", authUser.id);

      if (dbError) {
        console.error("[users/profile] DB update error:", dbError);
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }
    }

    // Update Supabase Auth user_metadata
    if (Object.keys(metadataUpdates).length > 0) {
      const { error: authError } = await admin.auth.admin.updateUserById(
        authUser.id,
        { user_metadata: metadataUpdates }
      );
      if (authError) {
        console.error("[users/profile] Auth metadata update error:", authError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    console.error("[users/profile] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
