/**
 * If "published" is saved with a future timestamp (common datetime-picker year mistake),
 * the public site used to hide the post under RLS. We still clamp in the API so data stays sane.
 */
export function clampPublishedAtIfInFuture(
  publishedAt: string | null | undefined,
  status: "draft" | "published"
): string | null {
  if (status !== "published") {
    return typeof publishedAt === "string" && publishedAt.trim() ? publishedAt.trim() : null;
  }
  const fallback = new Date().toISOString();
  if (!publishedAt?.trim()) return fallback;
  const ms = new Date(publishedAt).getTime();
  if (Number.isNaN(ms)) return fallback;
  if (ms > Date.now()) return fallback;
  return publishedAt.trim();
}
