import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderTrackClient } from "@/components/OrderTrackClient";
import { localeAlternatesAndSocial } from "@/lib/locale-seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("order");
  return localeAlternatesAndSocial(locale, "/order/track", {
    title: t("trackPageTitle"),
    description: t("trackPageTitle"),
    robots: { index: false, follow: false },
  });
}

export default async function OrderTrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ job_id?: string; token?: string }>;
}) {
  const { locale } = await params;
  const { job_id: jobId, token } = await searchParams;
  const t = await getTranslations("order");

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-8rem)] bg-[var(--background)] py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-[var(--primary)] sm:text-3xl">
            {t("trackPageTitle")}
          </h1>
          <div className="mt-6">
            <OrderTrackClient jobId={jobId ?? null} token={token ?? null} locale={locale} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
