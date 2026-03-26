"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderForm } from "@/components/OrderForm";
import { OrderBookingSideLottie } from "@/components/OrderBookingSideLottie";
import { OrderIntroDotLotties } from "@/components/OrderIntroDotLotties";

export function OrderPageClient({ locale, title }: { locale: string; title: string }) {
  const t = useTranslations("order");
  const [hideLogo, setHideLogo] = useState(false);
  /** null = لم يُحمَّل بعد من الـ API */
  const [bookingsPaused, setBookingsPaused] = useState<boolean | null>(null);
  const rtl = locale === "ar";

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
      <Header hideLogo={hideLogo} />
      <main className="min-h-[calc(100vh-8rem)] bg-[var(--background)] py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div
            className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)_minmax(0,1fr)] lg:items-stretch lg:gap-5 xl:gap-8"
            style={{ direction: "ltr" }}
          >
            <aside className="hidden lg:flex lg:items-center lg:justify-end lg:py-6">
              <OrderBookingSideLottie variant="a" />
            </aside>

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
              <OrderForm locale={locale} bookingsPaused={false} onOrderConfirmed={() => setHideLogo(true)} />
            </div>

            <aside className="hidden lg:flex lg:items-center lg:justify-start lg:py-6">
              <OrderBookingSideLottie variant="b" />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
