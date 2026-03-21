import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DriversCarousel } from "@/components/DriversCarousel";
import { HomeTransportOperations } from "@/components/HomeTransportOperations";
import { GermanyConnectSection } from "@/components/GermanyConnectSection";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-8rem)]">
        {/* Hero — برتقالي أفتح مع صورة الشاحنة */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#ffc9a3] via-[#ffb07a] to-[#f28a4a] text-white">
          <div className="absolute inset-0">
            <Image
              src="/images/van1.png"
              alt=""
              fill
              className="object-cover object-center opacity-45"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#e85d04]/50 via-[#e85d04]/38 to-transparent" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="whitespace-pre-line text-4xl font-extrabold leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.28)] sm:text-5xl md:text-6xl lg:text-7xl">
                {t("title")}
              </h1>
              <p className="mt-6 text-xl text-white/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.22)] sm:text-2xl">
                {t("subtitle")}
              </p>
              <div className="mt-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 px-8 py-6 shadow-xl">
                <p className="text-2xl font-bold text-white leading-relaxed sm:text-3xl">
                  {t("quote")}
                </p>
              </div>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
                <Link
                  href={`/${locale}/order`}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-bold text-[var(--accent)] shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  {t("cta")}
                </Link>
                <Link
                  href={`/${locale}/driver`}
                  className="inline-flex items-center justify-center rounded-xl border-2 border-white bg-transparent px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10 hover:scale-105"
                >
                  {t("applyAsDriver")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - تصميم احترافي */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-[var(--primary)] sm:text-4xl">
              {t("features.title")}
            </h2>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href={`/${locale}/why`}
                className="group block rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <svg className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[var(--primary)]">
                  {t("features.speed")}
                </h3>
                <p className="mt-3 text-[var(--foreground)]/70 leading-relaxed">
                  {t("features.speedDesc")}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--accent)] group-hover:underline">
                  {t("features.readMore")}
                  <span className="ms-1" aria-hidden>
                    →
                  </span>
                </span>
              </Link>
              <Link
                href={`/${locale}/why`}
                className="group block rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <svg className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[var(--primary)]">
                  {t("features.trust")}
                </h3>
                <p className="mt-3 text-[var(--foreground)]/70 leading-relaxed">
                  {t("features.trustDesc")}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--accent)] group-hover:underline">
                  {t("features.readMore")}
                  <span className="ms-1" aria-hidden>
                    →
                  </span>
                </span>
              </Link>
              <Link
                href={`/${locale}/why`}
                className="group block rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 sm:col-span-2 lg:col-span-1"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <svg className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[var(--primary)]">
                  {t("features.local")}
                </h3>
                <p className="mt-3 text-[var(--foreground)]/70 leading-relaxed">
                  {t("features.localDesc")}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--accent)] group-hover:underline">
                  {t("features.readMore")}
                  <span className="ms-1" aria-hidden>
                    →
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Drivers Carousel Section */}
        <DriversCarousel />

        <HomeTransportOperations />

        <GermanyConnectSection locale={locale} />

        {/* CTA Section - مع صورة الشاحنة */}
        <section className="bg-gradient-to-br from-gray-50 to-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="relative h-64 sm:h-80 lg:h-full lg:min-h-[400px]">
                  <Image
                    src="/images/van2.png"
                    alt="TransPool24"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center px-8 py-12 sm:px-12">
                  <h3 className="text-3xl font-bold text-[var(--primary)] sm:text-4xl">
                    TransPool24 – {t("features.local")}
                  </h3>
                  <p className="mt-4 text-lg text-[var(--foreground)]/80 leading-relaxed">
                    {t("features.localDesc")}
                  </p>
                  <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    <Link
                      href={`/${locale}/order`}
                      className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                    >
                      {t("cta")}
                    </Link>
                    <Link
                      href={`/${locale}/driver`}
                      className="inline-flex items-center justify-center rounded-xl border-2 border-[var(--accent)] bg-white px-8 py-4 font-semibold text-[var(--accent)] transition-all hover:bg-[var(--accent)]/5 hover:scale-105"
                    >
                      {t("driverSignup")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
