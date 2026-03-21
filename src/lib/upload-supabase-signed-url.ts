/**
 * Browser upload matching @supabase/storage-js uploadToSignedUrl (FormData + PUT).
 * @see https://github.com/supabase/supabase-js/blob/master/packages/core/storage-js/src/packages/StorageFileApi.ts
 */
export async function putFileToSupabaseSignedUrl(signedUrl: string, file: File, upsert = true): Promise<void> {
  const fd = new FormData();
  fd.append("cacheControl", "3600");
  fd.append("", file);
  const res = await fetch(signedUrl, {
    method: "PUT",
    headers: { "x-upsert": upsert ? "true" : "false" },
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.replace(/\s+/g, " ").slice(0, 220) || `Upload failed (${res.status})`);
  }
}
