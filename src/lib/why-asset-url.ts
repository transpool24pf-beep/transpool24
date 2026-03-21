/** CMS users sometimes paste `./images/foo.png`; Next/Image needs `/images/foo`. */
export function normalizeWhyAssetUrl(url: string): string {
  const t = url.trim();
  if (!t) return t;
  if (t.startsWith("./")) return t.slice(1);
  if (t.startsWith(".\\")) return "/" + t.slice(2).replace(/\\/g, "/");
  return t;
}
