/** Google AdSense publisher ID (site-wide). */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-9998186124580672";

/** Fixed sidebar rail dimensions (px), matches classic skyscraper slot. */
export const ADSENSE_SIDEBAR_WIDTH = 160;
export const ADSENSE_SIDEBAR_HEIGHT = 600;

/** Manual display units, create in AdSense → Ads → By ad unit → Display. */
export const ADSENSE_SLOT_SIDEBAR_LEFT =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_LEFT?.trim() ?? "6424372308";
export const ADSENSE_SLOT_SIDEBAR_RIGHT =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_RIGHT?.trim() ?? "1367340953";
export const ADSENSE_SLOT_BANNER =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER?.trim() ?? "6428095944";

export function adsenseManualUnitsConfigured(): boolean {
  return Boolean(
    ADSENSE_SLOT_SIDEBAR_LEFT ||
      ADSENSE_SLOT_SIDEBAR_RIGHT ||
      ADSENSE_SLOT_BANNER,
  );
}

/** Legal and driver flows stay ad-free. Order page uses in-form side units instead of fixed rails. */
const AD_FREE_SECTIONS = new Set([
  "driver",
  "privacy",
  "terms",
  "rate-driver",
]);

/**
 * Manual AdSense on marketing pages and the booking form.
 * Driver / legal pages stay ad-free.
 */
export function adsAllowedForPath(pathname: string | null): boolean {
  if (!pathname) return false;

  const parts = pathname.split("/").filter(Boolean);
  // /de, homepage
  if (parts.length === 1) return true;
  if (parts.length === 0) return false;

  const section = parts[1]?.toLowerCase() ?? "";
  if (!section) return true;
  if (AD_FREE_SECTIONS.has(section)) return false;

  return true;
}

/** Viewport-fixed skyscrapers; the order form has its own column ads. */
export function adsUseFixedSidebarRails(pathname: string | null): boolean {
  if (!adsAllowedForPath(pathname)) return false;
  const parts = pathname!.split("/").filter(Boolean);
  const section = parts[1]?.toLowerCase() ?? "";
  return section !== "order";
}
