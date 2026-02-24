import { createAdminClient } from "@/lib/supabase/server";

/**
 * Uploads a base64-encoded image to Supabase Storage.
 * Returns the storage path for use in database records.
 */
export async function uploadBase64ToStorage(
  base64: string,
  bucket: string,
  path: string
): Promise<string> {
  const admin = createAdminClient();

  // Strip data URL prefix if present
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  const mimeType = base64.includes(",")
    ? base64.split(",")[0].split(":")[1].split(";")[0]
    : "image/png";

  const buffer = Buffer.from(base64Data, "base64");

  const { error } = await admin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload to storage: ${error.message}`);
  }

  return path;
}

/**
 * Gets the public URL for a file in Supabase Storage.
 */
export function getPublicUrl(bucket: string, path: string): string {
  const admin = createAdminClient();
  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Uploads a raw buffer to Supabase Storage.
 * Used for video files (MP4) and other binary data.
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  bucket: string,
  path: string,
  contentType: string
): Promise<string> {
  const admin = createAdminClient();

  const { error } = await admin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload buffer to storage: ${error.message}`);
  }

  return path;
}

/**
 * Deletes a file from Supabase Storage.
 */
export async function deleteFromStorage(
  bucket: string,
  path: string
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).remove([path]);
  if (error) {
    console.error(`Failed to delete from storage: ${error.message}`);
  }
}
