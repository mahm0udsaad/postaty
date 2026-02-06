/**
 * Uploads a base64-encoded image to Convex file storage.
 * Returns the storage ID for use in Convex records.
 */
export async function uploadBase64ToConvex(
  base64: string,
  generateUploadUrl: () => Promise<string>
): Promise<string> {
  const uploadUrl = await generateUploadUrl();

  // Strip data URL prefix if present
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "image/png" });

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: blob,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image to Convex storage");
  }

  const { storageId } = await response.json();
  return storageId;
}
