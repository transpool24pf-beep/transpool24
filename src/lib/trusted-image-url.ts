/**
 * Only fetch remote POD images from known hosts (avoid SSRF). Public Supabase Storage + site CDN.
 */
export function isTrustedPodImageUrl(raw: string): boolean {
  const s = raw?.trim();
  if (!s) return false;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host.endsWith(".supabase.co")) return true;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (base) {
      const h = new URL(base).hostname.toLowerCase();
      if (host === h) return true;
    }
    if (host === "www.transpool24.com" || host === "transpool24.com") return true;
    return false;
  } catch {
    return false;
  }
}
