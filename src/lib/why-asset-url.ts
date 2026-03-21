/**
 * CMS paste cleanup: ./images → /images, trim quotes/BOM, accidental double https.
 */
export function normalizeWhyAssetUrl(url: string): string {
  let t = url
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^["'«»]+|["'«»]+$/g, "")
    .trim();
  if (!t) return t;
  if (t.startsWith("./")) t = t.slice(1);
  else if (t.startsWith(".\\")) t = "/" + t.slice(2).replace(/\\/g, "/");
  t = t.replace(/^https:\/\/https:\/\//i, "https://");
  return t;
}
