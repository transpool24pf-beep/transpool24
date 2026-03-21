"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { locales, type Locale } from "@/i18n/routing";

const localeLabels: Record<Locale, string> = {
  de: "DE",
  en: "EN",
  tr: "TR",
  fr: "FR",
  es: "ES",
  ar: "AR",
};

const LINKEDIN = "https://www.linkedin.com/in/trans-pool-1235803b8";
const INSTAGRAM = "https://www.instagram.com/transpool24/";

type Props = { locale: string };

export function WhyPageInformationClosing({ locale }: Props) {
  const t = useTranslations("infoPageClosing");
  const activeLocale = locale as Locale;
  const rtl = locale === "ar";

  return (
    <div className="w-full" dir={rtl ? "rtl" : "ltr"}>
      {/* Wave top → orange CTA (sennder-style) */}
      <div className="relative bg-[#f4f6f8]">
        <svg
          className="relative z-[1] -mb-px block h-10 w-full text-[#f28a4a] sm:h-14 md:h-16"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0,80 L0,35 Q360,65 720,42 T1440,35 L1440,80 Z"
          />
        </svg>
      </div>

      <section
        className="relative overflow-hidden bg-gradient-to-br from-[#ff9f6a] via-[#f07838] to-[#e85d04] px-4 py-12 text-white sm:px-8 sm:py-16 md:py-20"
        aria-labelledby="why-closing-cta-heading"
      >
        <div
          className="pointer-events-none absolute -end-24 top-1/2 h-[min(90vw,520px)] w-[min(90vw,520px)] -translate-y-1/2 rounded-full opacity-[0.12]"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, #fff 0%, transparent 55%), repeating-linear-gradient(-12deg, transparent, transparent 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 9px)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-stretch justify-between gap-8 sm:flex-row sm:items-center sm:gap-12">
          <div className="max-w-xl">
            <h2 id="why-closing-cta-heading" className="text-2xl font-extrabold leading-tight drop-shadow-sm sm:text-3xl md:text-4xl">
              {t("ctaHeadline")}
            </h2>
            <p className="mt-3 text-base text-white/90 sm:text-lg">{t("ctaSub")}</p>
          </div>
          <div className="shrink-0">
            <Link
              href={`/${locale}/support`}
              className="inline-flex min-h-[3rem] min-w-[10rem] items-center justify-center rounded-xl bg-white px-8 py-3.5 text-base font-bold text-[#0d2137] shadow-lg transition hover:bg-white/95 hover:shadow-xl"
            >
              {t("ctaButton")}
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#1c2128] text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="flex flex-col items-center lg:col-span-4 lg:items-start">
              <Link href={`/${locale}`} className="inline-block rounded-xl bg-white/95 p-3 shadow-md ring-1 ring-white/10">
                <Image
                  src="/345remov.png"
                  alt="TransPool24"
                  width={677}
                  height={369}
                  quality={100}
                  className="h-12 w-auto max-h-12 object-contain sm:h-14 sm:max-h-14 md:h-16 md:max-h-16"
                  sizes="(max-width: 768px) 200px, 260px"
                />
              </Link>
              <p className="mt-5 max-w-xs text-center text-sm text-white/65 lg:text-start">{t("brandTagline")}</p>
            </div>

            <nav className="grid gap-10 sm:grid-cols-3 lg:col-span-8" aria-label={t("navAria")}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">{t("colExplore")}</p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <Link href={`/${locale}`} className="text-white/90 transition hover:text-white hover:underline">
                      {t("linkHome")}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/why`} className="text-white/90 transition hover:text-white hover:underline">
                      {t("linkWhy")}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/support`} className="text-white/90 transition hover:text-white hover:underline">
                      {t("linkContact")}
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">{t("colInfo")}</p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <Link href={`/${locale}/support`} className="text-white/90 transition hover:text-white hover:underline">
                      {t("linkPrivacy")}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/support`} className="text-white/90 transition hover:text-white hover:underline">
                      {t("linkImprint")}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/support`} className="text-white/90 transition hover:text-white hover:underline">
                      {t("linkTerms")}
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">{t("colSocial")}</p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <a
                      href={LINKEDIN}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-white/90 transition hover:text-white hover:underline"
                    >
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      {t("socialLinkedin")}
                    </a>
                  </li>
                  <li>
                    <a
                      href={INSTAGRAM}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-white/90 transition hover:text-white hover:underline"
                    >
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                      {t("socialInstagram")}
                    </a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>{t("copyright", { year: new Date().getFullYear() })}</p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <a
                href="https://www.transpool24.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white hover:underline"
              >
                transpool24.com
              </a>
              <div className="flex flex-wrap items-center gap-2 border-white/10 sm:border-s sm:ps-4">
                <span className="text-white/50">{t("languageLabel")}</span>
                {locales.map((loc) => (
                  <Link
                    key={loc}
                    href={`/${loc}/why`}
                    className={
                      loc === activeLocale
                        ? "rounded-md bg-white/15 px-2 py-1 font-semibold text-white"
                        : "rounded-md px-2 py-1 text-white/75 hover:bg-white/10 hover:text-white"
                    }
                  >
                    {localeLabels[loc]}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
