"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderForm } from "@/components/OrderForm";
import { OrderBookingSideLottie } from "@/components/OrderBookingSideLottie";

export function OrderPageClient({ locale, title }: { locale: string; title: string }) {
  const [hideLogo, setHideLogo] = useState(false);
  return (
    <>
      <Header hideLogo={hideLogo} />
      <main className="min-h-[calc(100vh-8rem)] bg-[var(--background)] py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_minmax(0,36rem)_1fr] lg:gap-6 xl:gap-10">
            <aside className="hidden lg:flex lg:justify-end lg:pt-10 xl:pt-14">
              <OrderBookingSideLottie variant="a" />
            </aside>

            <div className="mx-auto min-w-0 w-full max-w-2xl">
              {!hideLogo && (
                <h1 className="text-2xl font-bold text-[var(--primary)] sm:text-3xl">
                  {title}
                </h1>
              )}
              <OrderForm locale={locale} onOrderConfirmed={() => setHideLogo(true)} />
            </div>

            <aside className="hidden lg:flex lg:justify-start lg:pt-10 xl:pt-14">
              <OrderBookingSideLottie variant="b" />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
