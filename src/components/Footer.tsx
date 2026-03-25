"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { locales, type Locale } from "@/i18n/routing";
import type { SiteSocialMediaPayload } from "@/lib/site-social-media";
import { LOCALE_NATIVE_LABEL } from "@/lib/locale-display";
import { LocaleFlagIcon } from "@/components/LocaleFlagIcon";

const FALLBACK_LINKEDIN = "https://www.linkedin.com/in/trans-pool-1235803b8";
const FALLBACK_INSTAGRAM = "https://www.instagram.com/transpool24/";

export function Footer() {
  const t = useTranslations("infoPageClosing");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const rtl = locale === "ar";
  const [social, setSocial] = useState<SiteSocialMediaPayload | null>(null);

  useEffect(() => {
    fetch("/api/public/social-media")
      .then((r) => r.json())
      .then((d: { social?: SiteSocialMediaPayload }) => setSocial(d.social ?? null))
      .catch(() => setSocial(null));
  }, []);

  const pathWithoutLocale = pathname?.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "";
  const basePath = pathWithoutLocale || "/";

  type SocialRow = { href: string; label: string; icon: "ig" | "tt" | "li" | "fb" | "yt" };
  const cmsRows: SocialRow[] = [];
  if (social?.instagramUrl) cmsRows.push({ href: social.instagramUrl, label: t("socialInstagram"), icon: "ig" });
  if (social?.tiktokUrl) cmsRows.push({ href: social.tiktokUrl, label: t("socialTiktok"), icon: "tt" });
  if (social?.linkedinUrl) cmsRows.push({ href: social.linkedinUrl, label: t("socialLinkedin"), icon: "li" });
  if (social?.facebookUrl) cmsRows.push({ href: social.facebookUrl, label: t("socialFacebook"), icon: "fb" });
  if (social?.youtubeUrl) cmsRows.push({ href: social.youtubeUrl, label: t("socialYoutube"), icon: "yt" });
  const socialRows: SocialRow[] =
    cmsRows.length > 0
      ? cmsRows
      : [
          { href: FALLBACK_LINKEDIN, label: t("socialLinkedin"), icon: "li" },
          { href: FALLBACK_INSTAGRAM, label: t("socialInstagram"), icon: "ig" },
        ];

  return (
    <div className="w-full" dir={rtl ? "rtl" : "ltr"}>
      <div className="relative bg-[#f4f6f8]">
        <svg
          className="relative z-[1] -mb-px block h-10 w-full text-[#f4a574] sm:h-14 md:h-16"
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
        className="relative overflow-hidden bg-gradient-to-br from-[#ffb088] via-[#f49050] to-[#e87028] px-4 py-12 text-white sm:px-8 sm:py-16 md:py-20"
        aria-labelledby="site-footer-cta-heading"
      >
        <div
          className="pointer-events-none absolute -end-24 top-1/2 h-[min(90vw,520px)] w-[min(90vw,520px)] -translate-y-1/2 rounded-full opacity-[0.1]"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, #fff 0%, transparent 55%), repeating-linear-gradient(-12deg, transparent, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 9px)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-stretch justify-between gap-8 sm:flex-row sm:items-center sm:gap-12">
          <div className="max-w-xl">
            <h2
              id="site-footer-cta-heading"
              className="text-2xl font-extrabold leading-tight drop-shadow-sm sm:text-3xl md:text-4xl"
            >
              {t("ctaHeadline")}
            </h2>
            <p className="mt-3 text-base text-white/95 sm:text-lg">{t("ctaSub")}</p>
          </div>
          <div className="shrink-0">
            <Link
              href={`/${locale}/support`}
              className="inline-flex min-h-[3rem] min-w-[10rem] items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-[#0d2137] shadow-lg transition hover:bg-white/95 hover:shadow-xl"
            >
              {t("ctaButton")}
              <span className="text-lg leading-none opacity-80 rtl:rotate-180" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#1c2128] text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="flex flex-col items-center lg:col-span-4 lg:items-start">
              <Link
                href={`/${locale}`}
                className="inline-flex rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c2128]"
                aria-label="TransPool24"
              >
                <Image
                  src="/356.png"
                  alt="TransPool24"
                  width={633}
                  height={325}
                  quality={100}
                  className="h-16 w-auto max-h-16 object-contain object-top sm:h-[4.5rem] sm:max-h-[4.5rem] md:h-20 md:max-h-20"
                  sizes="(max-width: 768px) 280px, 340px"
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
                    <Link href={`/${locale}/blog`} className="text-white/90 transition hover:text-white hover:underline">
                      {t("linkBlog")}
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
                    <Link href={`/${locale}/privacy`} className="text-white/90 transition hover:text-white hover:underline">
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
                  {socialRows.map((row) => (
                    <li key={row.href + row.label}>
                      <a
                        href={row.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-white/90 transition hover:text-white hover:underline"
                      >
                        <SocialGlyph kind={row.icon} />
                        {row.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <a
              href="https://www.transpool24.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white hover:underline"
            >
              transpool24.com
            </a>
            <div className="flex flex-col gap-2 border-white/10 sm:border-s sm:ps-4">
              <span className="text-white/50">{t("languageLabel")}</span>
              <div className="grid max-w-[22rem] grid-cols-2 gap-x-3 gap-y-1">
                {locales.map((loc) => (
                  <Link
                    key={loc}
                    href={`/${loc}${basePath === "/" ? "" : basePath}`}
                    className={`flex min-w-0 items-center gap-2 rounded-md px-1 py-1 text-left text-[11px] sm:text-xs ${
                      loc === locale
                        ? "bg-white/15 font-semibold text-white"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <LocaleFlagIcon locale={loc} />
                    <span className="min-w-0 truncate">{LOCALE_NATIVE_LABEL[loc]}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-black/50 bg-[#12151a]">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 text-center text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-start">
            <p>{t("copyright", { year: new Date().getFullYear() })}</p>
            <p className="text-white/45">{t("developerCredit")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SocialGlyph({ kind }: { kind: "ig" | "tt" | "li" | "fb" | "yt" }) {
  const cls = "h-4 w-4 shrink-0";
  switch (kind) {
    case "li":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "ig":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case "tt":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25v-.71h-2.73v13.54a2.91 2.91 0 01-2.91 2.9 2.91 2.91 0 01-2.64-1.72 2.9 2.9 0 012.48-4.05v-2.78a5.72 5.72 0 00-1-.1 5.73 5.73 0 00-5.73 5.73A5.73 5.73 0 0012 22.91 5.73 5.73 0 0017.73 17.18V9.43a7.25 7.25 0 004.25 1.37v-2.78a4.81 4.81 0 01-2.39-.33z" />
        </svg>
      );
    case "fb":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "yt":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    default:
      return null;
  }
}
