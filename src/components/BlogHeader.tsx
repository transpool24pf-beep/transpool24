"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";
import { LOCALE_NATIVE_LABEL, LOCALE_SHORT_CODE } from "@/lib/locale-display";
import { LocaleFlagIcon } from "@/components/LocaleFlagIcon";

type NavPage = { slug: string; title: string; nav_order: number };

export function BlogHeader() {
  const t = useTranslations("blog");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [pages, setPages] = useState<NavPage[]>([]);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/public/blog/pages?locale=${encodeURIComponent(locale)}`)
      .then((r) => r.json())
      .then((d: { pages?: NavPage[] }) => setPages(Array.isArray(d.pages) ? d.pages : []))
      .catch(() => setPages([]));
  }, [locale]);

  const pathWithoutLocale = pathname?.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "";
  const blogBase = `/blog`;
  const basePath = pathWithoutLocale.startsWith(blogBase) ? pathWithoutLocale : `${blogBase}`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d2137] text-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div className="mx-auto flex min-h-[4rem] max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Link
            href={`/${locale}/blog`}
            className="flex shrink-0 items-center gap-2 py-1"
            aria-label={t("magazineTitle")}
          >
            <span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-bold tracking-wide text-white ring-1 ring-white/20">
              {t("magazineBadge")}
            </span>
            <span className="hidden font-semibold text-white/95 sm:inline">{t("magazineTitle")}</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label={t("navAria")}>
            <Link
              href={`/${locale}/blog`}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathWithoutLocale === "/blog" || pathWithoutLocale === "/blog/"
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t("navArticles")}
            </Link>
            {pages.map((p) => (
              <Link
                key={p.slug}
                href={`/${locale}/blog/pages/${p.slug}`}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathWithoutLocale === `/blog/pages/${p.slug}`
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {p.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href={`/${locale}`}
            className="hidden rounded-lg border border-white/25 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 sm:inline-block"
          >
            {t("toCompanySite")}
          </Link>
          <Link
            href={`/${locale}/order`}
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            {t("bookTransport")}
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-2.5 py-2 text-sm font-medium text-white"
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              aria-label={`${t("language")}: ${LOCALE_NATIVE_LABEL[locale]}`}
            >
              <LocaleFlagIcon locale={locale} />
              <span className="tabular-nums">{LOCALE_SHORT_CODE[locale]}</span>
              <span className="text-[10px] leading-none text-white/70" aria-hidden>
                ▾
              </span>
            </button>
            {langOpen && (
              <div
                className="absolute end-0 top-full z-[60] mt-1 w-[min(22rem,calc(100vw-1.25rem))] rounded-xl border border-[#0d2137]/10 bg-[var(--background)] p-3 shadow-lg"
                role="listbox"
              >
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#0d2137]/55">
                  {t("language")}
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {locales.map((loc) => (
                    <Link
                      key={loc}
                      href={`/${loc}${basePath === "/blog" ? "/blog" : basePath}`}
                      role="option"
                      aria-selected={loc === locale}
                      className={`flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-sm transition hover:bg-[#0d2137]/5 ${
                        loc === locale ? "bg-[#0d2137]/[0.07] font-medium text-[#0d2137]" : "text-[var(--foreground)]"
                      }`}
                      onClick={() => setLangOpen(false)}
                    >
                      <LocaleFlagIcon locale={loc} />
                      <span className="min-w-0 truncate leading-tight">{LOCALE_NATIVE_LABEL[loc]}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 bg-[#0a1929] px-4 py-2 md:hidden">
        <nav className="flex flex-wrap gap-2" aria-label={t("navAria")}>
          <Link
            href={`/${locale}/blog`}
            className="rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/95"
          >
            {t("navArticles")}
          </Link>
          {pages.map((p) => (
            <Link
              key={p.slug}
              href={`/${locale}/blog/pages/${p.slug}`}
              className="rounded-md bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/85 ring-1 ring-white/10"
            >
              {p.title}
            </Link>
          ))}
          <Link href={`/${locale}`} className="rounded-md px-2.5 py-1.5 text-xs text-white/70 underline">
            {t("toCompanySite")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
