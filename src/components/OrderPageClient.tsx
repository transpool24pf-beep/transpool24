"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderForm } from "@/components/OrderForm";
import { OrderBookingSideLottie } from "@/components/OrderBookingSideLottie";

export function OrderPageClient({ locale, title }: { locale: string; title: string }) {
  const [hideLogo, setHideLogo] = useState(false);
  const rtl = locale === "ar";

  return (
    <>
      <Header hideLogo={hideLogo} />
      <main className="min-h-[calc(100vh-8rem)] bg-[var(--background)] py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* direction:ltr keeps decorative columns visually left | form | right in all locales */}
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
              <OrderForm locale={locale} onOrderConfirmed={() => setHideLogo(true)} />
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
