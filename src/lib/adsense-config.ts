/** Google AdSense publisher ID (site-wide). */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-9998186124580672";

/** Fixed sidebar rail dimensions (px), matches classic skyscraper slot. */
export const ADSENSE_SIDEBAR_WIDTH = 160;
export const ADSENSE_SIDEBAR_HEIGHT = 600;

/** Manual display units, create in AdSense → Ads → By ad unit → Display. */
export const ADSENSE_SLOT_SIDEBAR_LEFT =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_LEFT?.trim() || "6424372308";
export const ADSENSE_SLOT_SIDEBAR_RIGHT =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_RIGHT?.trim() || "1367340953";
export const ADSENSE_SLOT_BANNER =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER?.trim() || "6428095944";

export function adsenseManualUnitsConfigured(): boolean {
  return Boolean(
    ADSENSE_SLOT_SIDEBAR_LEFT ||
      ADSENSE_SLOT_SIDEBAR_RIGHT ||
      ADSENSE_SLOT_BANNER,
  );
}

/** Legal pages stay ad-free. Driver apply, order, why, and blog use in-page units. */
const AD_FREE_SECTIONS = new Set(["privacy", "terms", "rate-driver"]);

const IN_PAGE_AD_SECTIONS = new Set(["order", "driver", "why", "blog"]);

/**
 * Manual AdSense on marketing pages, booking, driver apply, why, and blog.
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
  if (section === "driver" && parts.length > 2) return false;

  return true;
}

/** Viewport-fixed skyscrapers; some pages use in-column ads instead. */
export function adsUseFixedSidebarRails(pathname: string | null): boolean {
  if (!adsAllowedForPath(pathname)) return false;
  const parts = pathname!.split("/").filter(Boolean);
  const section = parts[1]?.toLowerCase() ?? "";
  return !IN_PAGE_AD_SECTIONS.has(section);
}
