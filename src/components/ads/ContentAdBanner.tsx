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
  fr: "Publicité",
  es: "Anuncio",
  tr: "Reklam",
};

function adLabel(locale: string): string {
  return AD_LABEL[locale] ?? AD_LABEL.en!;
}

type Props = {
  region?: string;
  className?: string;
};

/** In-flow responsive banner (homepage, blog, why, support). */
export function ContentAdBanner({ region = "content-banner", className }: Props) {
  const locale = useLocale();
  const marketing = useMarketingConsent();
  const slot = ADSENSE_SLOT_BANNER;
  const configured = adsenseManualUnitsConfigured();
  const enabled = marketing && configured && Boolean(slot);

  if (!slot) return null;

  return (
    <>
      <AdSenseScript enabled={enabled} />
      <div
        className={`mx-auto w-full max-w-3xl px-4 py-4 ${className ?? ""}`}
        data-tp24-ad-region={region}
      >
        <AdFrame label={adLabel(locale)}>
          <AdSenseUnit slot={slot} variant="banner" enabled={enabled} />
        </AdFrame>
      </div>
    </>
  );
}
