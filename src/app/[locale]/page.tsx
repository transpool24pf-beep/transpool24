import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DriversCarousel } from "@/components/DriversCarousel";
import { HomeTransportOperations } from "@/components/HomeTransportOperations";
import { GermanyConnectSection } from "@/components/GermanyConnectSection";
import { HomepageDriverLogisticsLottie } from "@/components/HomepageDriverLogisticsLottie";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import { getHomepageHero } from "@/lib/homepage-hero";
import { localeAlternatesAndSocial } from "@/lib/locale-seo-metadata";

const FALLBACK_IMAGE = "/images/5677.png";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "siteMetadata" });
  const rawKw = t.raw("keywords");
  const keywords = Array.isArray(rawKw)
    ? (rawKw as unknown[]).filter((k): k is string => typeof k === "string")
    : [];
  return localeAlternatesAndSocial(locale, "", {
    title: t("title"),
    description: t("description"),
    keywords,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const hero = await getHomepageHero(locale);

  const heroImage = hero.imageUrl || FALLBACK_IMAGE;
  const heroHeadline = hero.headline || t("heroHeadline");
  const heroSubtitle = hero.subtitle || t("subtitle");
  const heroCta = hero.cta || t("cta");

  return (
    <>
      <HomeJsonLd locale={locale} />
      <Header />
      <main className="min-h-[calc(100vh-8rem)]">
        {/* Hero — CMS-driven (classic homepage; logistics cover lives on /blog) */}
        <section className="relative min-h-[min(90vh,42rem)] overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt=""
              fill
              className="object-cover object-center"
              priority
              quality={100}
              sizes="100vw"
              unoptimized={heroImage.startsWith("http")}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent rtl:bg-gradient-to-l rtl:from-black/70 rtl:via-black/40 rtl:to-transparent" />
          </div>
          <div className="relative flex min-h-[min(90vh,42rem)] flex-col justify-center px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <div className="max-w-2xl">
                <div
                  className="relative inline-block max-w-full rounded-xl border-2 border-white/55 bg-[var(--accent)] px-5 py-4 sm:px-8 sm:py-6 md:px-9 md:py-7"
                  style={{
                    boxShadow:
                      "0 8px 32px rgba(232,93,4,0.4), inset 0 0 0 1px rgba(255,255,255,0.3), 0 0 0 3px rgba(255,255,255,0.12)",
                  }}
                >
                  <div className="absolute left-2 top-2 h-5 w-5 rounded-tl border-l-2 border-t-2 border-white/60" aria-hidden />
                  <div className="absolute right-2 top-2 h-5 w-5 rounded-tr border-r-2 border-t-2 border-white/60" aria-hidden />
                  <div className="absolute bottom-2 left-2 h-5 w-5 rounded-bl border-b-2 border-l-2 border-white/60" aria-hidden />
                  <div className="absolute bottom-2 right-2 h-5 w-5 rounded-br border-b-2 border-r-2 border-white/60" aria-hidden />
                  <h1 className="relative text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                    {heroHeadline}
                  </h1>
                </div>
                <p className="mt-6 max-w-2xl text-xl font-semibold leading-snug text-white/95 drop-shadow-sm sm:text-2xl md:text-2xl">
                  {heroSubtitle}
                </p>
                <Link
                  href={`/${locale}/order`}
                  className="mt-10 inline-flex items-center gap-2 rounded-xl border-2 border-white/50 bg-[var(--accent)] px-10 py-4 text-lg font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.2)] transition hover:brightness-110"
                >
                  {heroCta}
                  <svg
                    className="h-5 w-5 rtl:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
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

        {/* Driver CTA — immersive card (sennder-style), single “Become a driver” action */}
        <section className="bg-[#f5f5f5] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              {t("driverCta.eyebrow")}
            </p>
            <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-[#0d2137] sm:text-4xl">
              {t("driverCta.sectionTitle")}
            </h2>
            <div className="relative mt-10 min-h-[min(32rem,85vh)] overflow-hidden rounded-3xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/10 sm:min-h-[28rem]">
              <div className="absolute inset-0">
                <Image
                  src="/images/5677.png"
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/55 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/45 to-transparent rtl:bg-gradient-to-l" />
              </div>
              <div className="relative z-10 flex min-h-[min(32rem,85vh)] flex-col justify-end gap-12 px-8 py-12 sm:min-h-[28rem] sm:px-12 sm:py-14 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
                <div className="max-w-2xl border-s-4 border-[var(--accent)] ps-5 sm:ps-6">
                  <h3 className="text-3xl font-bold leading-[1.15] text-white drop-shadow-sm sm:text-4xl lg:text-[2.35rem]">
                    {t("driverCta.headline")}
                  </h3>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-white/92 sm:text-lg">
                    {t("driverCta.body")}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-6 pb-1 lg:items-end">
                  <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-full ring-[3px] ring-white/45 shadow-[0_8px_32px_rgba(0,0,0,0.4)] sm:h-40 sm:w-40">
                    <Image
                      src="/4566.png"
                      alt={t("driverCta.logoAlt")}
                      fill
                      className="object-cover object-center"
                      sizes="160px"
                    />
                  </div>
                  <Link
                    href={`/${locale}/driver`}
                    className="inline-flex w-full min-w-[min(100%,16rem)] max-w-xs items-center justify-center rounded-xl bg-[var(--accent)] px-10 py-4 text-center text-base font-bold text-white shadow-lg transition hover:brightness-110 sm:text-lg"
                  >
                    {t("driverSignup")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <HomepageDriverLogisticsLottie />
      </main>
      <Footer />
    </>
  );
}
