import type { Metadata } from "next";

const BRAND = "TransPool24";

/**
 * Normalizes any legacy title string to `<title>TransPool24 | …</title>` for consistent branding.
 */
export function seoDocumentTitle(raw: string): Metadata["title"] {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s) return { absolute: BRAND };
  if (/^TransPool24\s*\|/i.test(s)) {
    return { absolute: s };
  }
  const dash = s.match(/^TransPool24\s*[–—\-]\s*(.+)$/i);
  if (dash) {
    return { absolute: `${BRAND} | ${dash[1].trim()}` };
  }
  const trimmed = s.replace(/\s*\|\s*TransPool24(?:\s*[—–-].*)?$/i, "").trim();
  const rest = trimmed.length > 0 ? trimmed : s;
  return { absolute: `${BRAND} | ${rest}` };
}

export function plainSeoTitle(raw: string): string {
  const t = seoDocumentTitle(raw);
  return typeof t === "object" && t !== null && "absolute" in t && typeof t.absolute === "string"
    ? t.absolute
    : BRAND;
}
