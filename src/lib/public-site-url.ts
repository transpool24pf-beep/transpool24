/** Canonical public origin (no trailing slash). Used for sitemap, robots, JSON-LD, admin deploy info. */
export function getPublicSiteUrl(): string {
  let raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com").trim().replace(/\/$/, "");
  if (!raw) raw = "https://www.transpool24.com";
  raw = raw.replace(/^http:/i, "https:");
  raw = raw.replace(/:\/\/(www\.)?transpool24\.com/i, "://www.transpool24.com");
  return raw;
}
