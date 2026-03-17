"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderForm } from "@/components/OrderForm";

export function OrderPageClient({ locale, title }: { locale: string; title: string }) {
  const [hideLogo, setHideLogo] = useState(false);
  return (
    <>
      <Header hideLogo={hideLogo} />
      <main className="min-h-[calc(100vh-8rem)] bg-[var(--background)] py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {!hideLogo && (
            <h1 className="text-2xl font-bold text-[var(--primary)] sm:text-3xl">
              {title}
            </h1>
          )}
          <OrderForm locale={locale} onOrderConfirmed={() => setHideLogo(true)} />
        </div>
      </main>
      <Footer />
    </>
  );
}
