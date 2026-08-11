"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ADSENSE_SLOT_SIDEBAR_LEFT,
  ADSENSE_SLOT_SIDEBAR_RIGHT,
  adsAllowedForPath,
  adsenseManualUnitsConfigured,
} from "@/lib/adsense-config";
import { AdRailPageGutter, AdSidebarRail } from "@/components/ads/AdSidebarRail";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { useMarketingConsent } from "@/components/ads/useMarketingConsent";

const AD_LABEL: Record<string, string> = {
  de: "Werbung",
  en: "Ad",
  ar: "إعلان",
  fr: "Publicité",
  es: "Anuncio",
  tr: "Reklam",
  it: "Pubblicità",
  pl: "Reklama",
  ru: "Реклама",
  ro: "Reclamă",
  ku: "Reklam",
  uk: "Реклама",
};

function adLabel(locale: string): string {
  return AD_LABEL[locale] ?? AD_LABEL.en!;
}

/**
 * Fixed-size side rails (stay on screen while scrolling) on wide viewports.
 */
export function AdSensePlacements() {
  const pathname = usePathname();
  const locale = useLocale();
  const marketing = useMarketingConsent();

  const allowed = adsAllowedForPath(pathname);
  const configured = adsenseManualUnitsConfigured();
  const enabled = allowed && marketing && configured;
  const showRails =
    marketing && Boolean(ADSENSE_SLOT_SIDEBAR_LEFT || ADSENSE_SLOT_SIDEBAR_RIGHT);

  if (!allowed) return null;

  const label = adLabel(locale);

  return (
    <>
      <AdSenseScript enabled={enabled} />
      <AdRailPageGutter active={enabled && showRails} />

      {showRails && ADSENSE_SLOT_SIDEBAR_LEFT ? (
        <AdSidebarRail
          side="left"
          slot={ADSENSE_SLOT_SIDEBAR_LEFT}
          label={label}
          enabled={enabled}
        />
      ) : null}

      {showRails && ADSENSE_SLOT_SIDEBAR_RIGHT ? (
        <AdSidebarRail
          side="right"
          slot={ADSENSE_SLOT_SIDEBAR_RIGHT}
          label={label}
          enabled={enabled}
        />
      ) : null}
    </>
  );
}
