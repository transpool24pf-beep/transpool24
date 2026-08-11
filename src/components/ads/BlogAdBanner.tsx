"use client";

import { ADSENSE_SLOT_BANNER, adsenseManualUnitsConfigured } from "@/lib/adsense-config";
import { AdFrame } from "@/components/ads/AdFrame";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { AdSenseUnit } from "@/components/ads/AdSenseUnit";
import { useMarketingConsent } from "@/components/ads/useMarketingConsent";
import { useLocale } from "next-intl";

const AD_LABEL: Record<string, string> = {
  de: "Werbung",
  en: "Ad",
  ar: "إعلان",
};

function adLabel(locale: string): string {
  return AD_LABEL[locale] ?? AD_LABEL.en!;
}

/** In-flow banner below blog header (not above site chrome). */
export function BlogAdBanner() {
  const locale = useLocale();
  const marketing = useMarketingConsent();
  const slot = ADSENSE_SLOT_BANNER;
  const configured = adsenseManualUnitsConfigured();
  const enabled = marketing && configured && Boolean(slot);

  if (!slot) return null;

  return (
    <>
      <AdSenseScript enabled={enabled} />
      <div className="mx-auto w-full max-w-3xl px-4 py-4" data-tp24-ad-region="blog-banner">
        <AdFrame label={adLabel(locale)}>
          <AdSenseUnit slot={slot} variant="banner" enabled={enabled} />
        </AdFrame>
      </div>
    </>
  );
}
