"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderForm } from "@/components/OrderForm";
import { OrderBookingBannerAd, OrderBookingSideAd, OrderBookingStickyBanner, useIsDesktopLg } from "@/components/OrderBookingSideAd";
import { OrderIntroDotLotties } from "@/components/OrderIntroDotLotties";
import { adLabel } from "@/components/ads/AdSensePlacements";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import {
  ADSENSE_SLOT_BANNER,
  ADSENSE_SLOT_SIDEBAR_LEFT,
  ADSENSE_SLOT_SIDEBAR_RIGHT,
  adsenseManualUnitsConfigured,
} from "@/lib/adsense-config";

export function OrderPageClient({ locale, title }: { locale: string; title: string }) {
  const t = useTranslations("order");
  const [hideLogo, setHideLogo] = useState(false);
  /** null = لم يُحمَّل بعد من الـ API */
  const [bookingsPaused, setBookingsPaused] = useState<boolean | null>(null);
  const rtl = locale === "ar";
  const adsEnabled = adsenseManualUnitsConfigured();
  const adsLabel = adLabel(locale);
  const { isDesktop, ready } = useIsDesktopLg();
  const showMobileAds = ready && !isDesktop;
  const showDesktopAds = ready && isDesktop;

  const refreshBookingsStatus = useCallback(() => {
    fetch("/api/public/bookings-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { paused?: boolean }) => setBookingsPaused(Boolean(d.paused)))
      .catch(() => setBookingsPaused(false));
  }, []);

  useEffect(() => {
    refreshBookingsStatus();
    const onVis = () => {
      if (document.visibilityState === "visible") refreshBookingsStatus();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", refreshBookingsStatus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", refreshBookingsStatus);
    };
  }, [refreshBookingsStatus]);

  if (bookingsPaused === null) {
    return (
      <>
        <Header hideLogo={hideLogo} />
        <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-[var(--background)] px-4 py-16">
          <p className="text-sm text-[#0d2137]/60">{t("loading")}</p>
        </main>
        <Footer />
      </>
    );
  }

  if (bookingsPaused) {
    return (
      <>
        <Header hideLogo={false} />
        <main className="min-h-[calc(100vh-8rem)] bg-[var(--background)] px-4 py-6 sm:py-10">
          <div
            className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl flex-col items-center justify-center gap-2"
            dir={rtl ? "rtl" : "ltr"}
            lang={locale}
          >
            <h1 className="text-center text-2xl font-bold text-[var(--primary)] sm:text-3xl">{title}</h1>
            <div
              className="mt-4 w-full max-w-xl rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
              role="status"
            >
              <p className="font-semibold">{t("bookingsPausedTitle")}</p>
              <p className="mt-1 leading-relaxed text-amber-900/90">{t("bookingsPausedBody")}</p>
            </div>
            <div className="mt-2 flex w-full flex-1 flex-col items-center justify-center">
              <OrderIntroDotLotties layout="fullscreen" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <AdSenseScript enabled={adsEnabled} />
      <Header hideLogo={hideLogo} />
      <main className={`min-h-[calc(100vh-8rem)] bg-[var(--background)] py-8 ${showMobileAds ? "pb-36" : ""}`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div
            className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)_minmax(0,1fr)] lg:items-stretch lg:gap-5 xl:gap-8"
            style={{ direction: "ltr" }}
          >
            {showDesktopAds ? (
              <aside className="flex items-start justify-end py-6">
                <OrderBookingSideAd
                  slot={ADSENSE_SLOT_SIDEBAR_LEFT}
                  label={adsLabel}
                  enabled={adsEnabled}
                />
              </aside>
            ) : null}

            <div
              className="mx-auto min-w-0 w-full max-w-2xl lg:py-2"
              dir={rtl ? "rtl" : "ltr"}
              lang={locale}
            >
              {!hideLogo && (
                <h1 className="text-2xl font-bold text-[var(--primary)] sm:text-3xl">
                  {title}
                </h1>
              )}
              {showMobileAds ? (
                <OrderBookingBannerAd
                  slot={ADSENSE_SLOT_SIDEBAR_LEFT}
                  label={adsLabel}
                  enabled={adsEnabled}
                />
              ) : null}
              <OrderForm locale={locale} bookingsPaused={false} onOrderConfirmed={() => setHideLogo(true)} />
              {showMobileAds ? (
                <OrderBookingBannerAd
                  slot={ADSENSE_SLOT_SIDEBAR_RIGHT}
                  label={adsLabel}
                  enabled={adsEnabled}
                />
              ) : null}
            </div>

            {showDesktopAds ? (
              <aside className="flex items-start justify-start py-6">
                <OrderBookingSideAd
                  slot={ADSENSE_SLOT_SIDEBAR_RIGHT}
                  label={adsLabel}
                  enabled={adsEnabled}
                />
              </aside>
            ) : null}
          </div>
        </div>
      </main>
      {showMobileAds ? (
        <OrderBookingStickyBanner
          slot={ADSENSE_SLOT_BANNER}
          label={adsLabel}
          enabled={adsEnabled}
        />
      ) : null}
      <Footer />
    </>
  );
}
