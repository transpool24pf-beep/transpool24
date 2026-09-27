"use client";

import { useLocale } from "next-intl";
import { OrderBookingBannerAd, OrderBookingSideAd, OrderBookingWideBanner, useIsDesktopLg } from "@/components/OrderBookingSideAd";
import { adLabel } from "@/components/ads/AdSensePlacements";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import {
  ADSENSE_SLOT_BANNER,
  ADSENSE_SLOT_SIDEBAR_LEFT,
  ADSENSE_SLOT_SIDEBAR_RIGHT,
  adsenseManualUnitsConfigured,
} from "@/lib/adsense-config";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** sides = tall rails. banners = full-width ads above/below (Join us / driver page). */
  placement?: "sides" | "banners";
};

/** Desktop: large side units. Phone: compact 90px banners above and below the page. */
export function PageAdsLayout({ children, className = "", placement = "sides" }: Props) {
  const locale = useLocale();
  const adsEnabled = adsenseManualUnitsConfigured();
  const adsLabel = adLabel(locale);
  const { isDesktop, ready } = useIsDesktopLg();
  const showMobileAds = ready && !isDesktop;
  const showDesktopAds = ready && isDesktop;

  if (placement === "banners") {
    return (
      <>
        <AdSenseScript enabled={adsEnabled} />
        <div className={`w-full ${className}`}>
          {children}
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <OrderBookingWideBanner
              slot={ADSENSE_SLOT_BANNER}
              label={adsLabel}
              enabled={adsEnabled}
            />
            <OrderBookingWideBanner
              slot={showDesktopAds ? ADSENSE_SLOT_SIDEBAR_RIGHT : ADSENSE_SLOT_SIDEBAR_LEFT}
              label={adsLabel}
              enabled={adsEnabled}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdSenseScript enabled={adsEnabled} />
      <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className}`}>
        <div
          className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[176px_minmax(0,1fr)_176px] xl:gap-8"
          style={{ direction: "ltr" }}
        >
          {showDesktopAds ? (
            <aside className="flex justify-end py-4">
              <OrderBookingSideAd
                slot={ADSENSE_SLOT_SIDEBAR_LEFT}
                label={adsLabel}
                enabled={adsEnabled}
              />
            </aside>
          ) : null}

          <div className="min-w-0">
            {showMobileAds ? (
              <OrderBookingBannerAd
                slot={ADSENSE_SLOT_BANNER}
                label={adsLabel}
                enabled={adsEnabled}
              />
            ) : null}
            {children}
            {showMobileAds ? (
              <OrderBookingBannerAd
                slot={ADSENSE_SLOT_SIDEBAR_LEFT}
                label={adsLabel}
                enabled={adsEnabled}
              />
            ) : null}
          </div>

          {showDesktopAds ? (
            <aside className="flex justify-start py-4">
              <OrderBookingSideAd
                slot={ADSENSE_SLOT_SIDEBAR_RIGHT}
                label={adsLabel}
                enabled={adsEnabled}
              />
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );
}
