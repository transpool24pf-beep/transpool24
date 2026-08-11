"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ADSENSE_SLOT_SIDEBAR_LEFT,
  ADSENSE_SLOT_SIDEBAR_RIGHT,
  adsAllowedForPath,
  adsenseManualUnitsConfigured,
} from "@/lib/adsense-config";
import { AdFrame } from "@/components/ads/AdFrame";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { AdSenseUnit } from "@/components/ads/AdSenseUnit";
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
 * Fixed side rails (wide desktop) + optional in-flow banner on blog.
 * Replaces intrusive Auto ads with predictable slots.
 */
export function AdSensePlacements() {
  const pathname = usePathname();
  const locale = useLocale();
  const marketing = useMarketingConsent();

  const allowed = adsAllowedForPath(pathname);
  const configured = adsenseManualUnitsConfigured();
  const enabled = allowed && marketing && configured;

  if (!allowed) return null;

  const label = adLabel(locale);

  return (
    <>
      <AdSenseScript enabled={enabled} />

      {marketing && (ADSENSE_SLOT_SIDEBAR_LEFT || ADSENSE_SLOT_SIDEBAR_RIGHT) ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[14] hidden min-[1400px]:block"
          aria-hidden={!enabled}
        >
          <div className="mx-auto flex max-w-[1920px] justify-between px-3">
            {ADSENSE_SLOT_SIDEBAR_LEFT ? (
              <div
                className="pointer-events-auto w-[168px] pt-28"
                data-tp24-ad-region="sidebar-left"
              >
                <AdFrame label={label}>
                  <AdSenseUnit
                    slot={ADSENSE_SLOT_SIDEBAR_LEFT}
                    variant="sidebar"
                    enabled={enabled}
                  />
                </AdFrame>
              </div>
            ) : (
              <div className="w-[168px]" />
            )}

            <div className="min-w-0 flex-1" />

            {ADSENSE_SLOT_SIDEBAR_RIGHT ? (
              <div
                className="pointer-events-auto w-[168px] pt-28"
                data-tp24-ad-region="sidebar-right"
              >
                <AdFrame label={label}>
                  <AdSenseUnit
                    slot={ADSENSE_SLOT_SIDEBAR_RIGHT}
                    variant="sidebar"
                    enabled={enabled}
                  />
                </AdFrame>
              </div>
            ) : (
              <div className="w-[168px]" />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
