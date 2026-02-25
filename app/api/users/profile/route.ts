import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string | null;
    const avatarFile = formData.get("avatar") as File | null;

    const updates: Record<string, string> = {};

    // Handle avatar upload
    if (avatarFile && avatarFile.size > 0) {
      if (avatarFile.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Avatar must be under 2MB" },
          { status: 400 }
        );
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(avatarFile.type)) {
        return NextResponse.json(
          { error: "Only JPEG, PNG, and WebP images are allowed" },
          { status: 400 }
        );
      }

      const admin = createAdminClient();
      const ext = avatarFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;

      const arrayBuffer = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await admin.storage
        .from("avatars")
        .upload(filePath, buffer, {
          contentType: avatarFile.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload avatar" },
          { status: 500 }
        );
      }

      const {
        data: { publicUrl },
      } = admin.storage.from("avatars").getPublicUrl(filePath);

      // Add cache-bust to force browsers to fetch the new image
      updates.avatar_url = `${publicUrl}?t=${Date.now()}`;
    }

    if (name !== null && name !== undefined) {
      updates.full_name = name.trim();
      updates.name = name.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // Update Supabase auth user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: updates,
    });

    if (updateError) {
      console.error("User metadata update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Also update the users table name if it changed
    if (updates.full_name) {
      const admin = createAdminClient();
      await admin
        .from("users")
        .update({ name: updates.full_name })
        .eq("auth_id", user.id);
    }

    return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error("PATCH /api/users/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
