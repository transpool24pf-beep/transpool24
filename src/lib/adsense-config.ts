/** Google AdSense publisher ID (site-wide). */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-9998186124580672";

/** Manual display units — create in AdSense → Ads → By ad unit → Display. */
export const ADSENSE_SLOT_SIDEBAR_LEFT =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_LEFT?.trim() ?? "";
export const ADSENSE_SLOT_SIDEBAR_RIGHT =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_RIGHT?.trim() ?? "";
export const ADSENSE_SLOT_BANNER =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER?.trim() ?? "";

export function adsenseManualUnitsConfigured(): boolean {
  return Boolean(
    ADSENSE_SLOT_SIDEBAR_LEFT ||
      ADSENSE_SLOT_SIDEBAR_RIGHT ||
      ADSENSE_SLOT_BANNER,
  );
}

/**
 * Only show fixed, manual placements on editorial / marketing pages.
 * Order, legal, driver flows stay ad-free.
 */
export function adsAllowedForPath(pathname: string | null): boolean {
  if (!pathname) return false;

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return false;

  const section = parts[1]?.toLowerCase();
  if (!section) return true;
  if (section === "blog" || section === "why") return true;

  return false;
}
