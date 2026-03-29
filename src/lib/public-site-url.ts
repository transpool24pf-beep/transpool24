/** Canonical public origin (no trailing slash). Used for sitemap, robots, JSON-LD, admin deploy info. */
export function getPublicSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com").replace(/\/$/, "");
}
