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

  const navActive =
    "rounded-lg bg-[var(--accent)]/10 px-3 py-2 text-sm font-semibold text-[var(--accent)]";
  const navIdle =
    "rounded-lg px-3 py-2 text-sm font-medium text-[#3d3d3d] transition hover:bg-black/[0.04] hover:text-[#1a1a1a]";

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-white text-[#1a1a1a] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex min-h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Link
            href={`/${locale}/blog`}
            className="flex shrink-0 items-center gap-2 py-1"
            aria-label={t("magazineTitle")}
          >
            <span className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-bold tracking-wide text-white shadow-sm">
              {t("magazineBadge")}
            </span>
            <span className="hidden font-bold text-[#1a1a1a] sm:inline">{t("magazineTitle")}</span>
          </Link>
          <nav className="hidden items-center gap-0.5 md:flex" aria-label={t("navAria")}>
            <Link
              href={`/${locale}/blog`}
              className={
                pathWithoutLocale === "/blog" || pathWithoutLocale === "/blog/" ? navActive : navIdle
              }
            >
              {t("navArticles")}
            </Link>
            {pages.map((p) => (
              <Link
                key={p.slug}
                href={`/${locale}/blog/pages/${p.slug}`}
                className={
                  pathWithoutLocale === `/blog/pages/${p.slug}` ? navActive : navIdle
                }
              >
                {p.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href={`/${locale}`}
            className="hidden rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-[#3d3d3d] transition hover:border-[var(--accent)]/40 hover:text-[#1a1a1a] sm:inline-block"
          >
            {t("toCompanySite")}
          </Link>
          <Link
            href={`/${locale}/order`}
            className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_20px_-6px_rgba(232,93,4,0.5)] transition hover:bg-[var(--accent-hover)]"
          >
            {t("bookTransport")}
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm font-semibold text-[#1a1a1a] shadow-sm"
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              aria-label={`${t("language")}: ${LOCALE_NATIVE_LABEL[locale]}`}
            >
              <LocaleFlagIcon locale={locale} />
              <span className="tabular-nums">{LOCALE_SHORT_CODE[locale]}</span>
              <span className="text-[10px] leading-none text-[#6b6b6b]" aria-hidden>
                ▾
              </span>
            </button>
            {langOpen && (
              <div
                className="absolute end-0 top-full z-[60] mt-1 w-[min(22rem,calc(100vw-1.25rem))] rounded-xl border border-black/10 bg-white p-3 shadow-xl"
                role="listbox"
              >
                <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-[#6b6b6b]">
                  {t("language")}
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {locales.map((loc) => (
                    <Link
                      key={loc}
                      href={`/${loc}${basePath === "/blog" ? "/blog" : basePath}`}
                      role="option"
                      aria-selected={loc === locale}
                      className={`flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-sm transition hover:bg-black/[0.04] ${
                        loc === locale ? "bg-[var(--accent)]/10 font-semibold text-[var(--accent)]" : "text-[#1a1a1a]"
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
      <div className="border-t border-black/[0.06] bg-[#fafafa] px-4 py-2 md:hidden">
        <nav className="flex flex-wrap gap-2" aria-label={t("navAria")}>
          <Link
            href={`/${locale}/blog`}
            className="rounded-md bg-[var(--accent)]/12 px-2.5 py-1.5 text-xs font-semibold text-[var(--accent)]"
          >
            {t("navArticles")}
          </Link>
          {pages.map((p) => (
            <Link
              key={p.slug}
              href={`/${locale}/blog/pages/${p.slug}`}
              className="rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-xs font-medium text-[#3d3d3d]"
            >
              {p.title}
            </Link>
          ))}
          <Link href={`/${locale}`} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-[#6b6b6b] underline">
            {t("toCompanySite")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
