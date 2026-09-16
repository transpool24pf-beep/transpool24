"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";
import { LOCALE_NATIVE_LABEL, LOCALE_SHORT_CODE } from "@/lib/locale-display";
import { LocaleFlagIcon } from "@/components/LocaleFlagIcon";
import { BrandWordmark } from "@/components/BrandWordmark";
import { SiteSocialIcons } from "@/components/SiteSocialIcons";

type NavPage = { slug: string; title: string; nav_order: number };

export function BlogHeader() {
  const t = useTranslations("blog");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [pages, setPages] = useState<NavPage[]>([]);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/public/blog/pages?locale=${encodeURIComponent(locale)}`)
      .then((r) => r.json())
      .then((d: { pages?: NavPage[] }) => setPages(Array.isArray(d.pages) ? d.pages : []))
      .catch(() => setPages([]));
  }, [locale]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const tgt = e.target as Node;
      if (servicesRef.current && !servicesRef.current.contains(tgt)) setServicesOpen(false);
      if (pagesRef.current && !pagesRef.current.contains(tgt)) setPagesOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const pathWithoutLocale = pathname?.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "";
  const blogBase = `/blog`;
  const basePath = pathWithoutLocale.startsWith(blogBase) ? pathWithoutLocale : `${blogBase}`;
  const isBlogIndex = pathWithoutLocale === "/blog" || pathWithoutLocale === "/blog/";
  const aboutNavHref = isBlogIndex ? `/${locale}/blog#about-transpool24-inline` : `/${locale}/why`;

  const navMain =
    "rounded-md px-3 py-2 text-sm font-semibold text-[#2d2d2d] transition hover:bg-black/[0.04] hover:text-[#1a1a1a]";
  const navActive = "rounded-md bg-[var(--accent)]/12 px-3 py-2 text-sm font-bold text-[var(--accent)]";

  return (
    <header className="sticky top-0 z-50 bg-white text-[#1a1a1a] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]">
      <div className="border-b border-black/[0.08] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href={`/${locale}`} className="flex shrink-0 items-center py-1" aria-label="TransPool24">
            <BrandWordmark className="text-[1.4rem] sm:text-[1.6rem] md:text-[1.75rem]" />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t("navAria")}>
            <Link href={`/${locale}`} className={pathWithoutLocale === "/" || pathWithoutLocale === "" ? navActive : navMain}>
              {t("template.navHome")}
            </Link>
            <Link href={aboutNavHref} className={pathWithoutLocale.startsWith("/why") ? navActive : navMain}>
              {t("template.navAbout")}
            </Link>

            <div className="relative" ref={servicesRef}>
              <button
                type="button"
                onClick={() => {
                  setServicesOpen((o) => !o);
                  setPagesOpen(false);
                }}
                className={`${navMain} inline-flex items-center gap-1`}
                aria-expanded={servicesOpen}
              >
                {t("template.navServices")}
                <span className="text-[10px]" aria-hidden>
                  ▾
                </span>
              </button>
              {servicesOpen ? (
                <div
                  role="menu"
                  className="absolute start-0 top-full z-[60] mt-1 min-w-[12rem] rounded-lg border border-black/10 bg-white py-2 shadow-xl"
                >
                  <Link href={`/${locale}/order`} className="block px-4 py-2 text-sm font-medium hover:bg-black/[0.04]" role="menuitem">
                    {t("template.ddRoad")}
                  </Link>
                  <Link href={`/${locale}/why`} className="block px-4 py-2 text-sm font-medium hover:bg-black/[0.04]" role="menuitem">
                    {t("template.ddSea")}
                  </Link>
                  <Link href={`/${locale}/order`} className="block px-4 py-2 text-sm font-medium hover:bg-black/[0.04]" role="menuitem">
                    {t("template.ddBook")}
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="relative" ref={pagesRef}>
              <button
                type="button"
                onClick={() => {
                  setPagesOpen((o) => !o);
                  setServicesOpen(false);
                }}
                className={`${navMain} inline-flex items-center gap-1`}
                aria-expanded={pagesOpen}
              >
                {t("template.navPages")}
                <span className="text-[10px]" aria-hidden>
                  ▾
                </span>
              </button>
              {pagesOpen ? (
                <div
                  role="menu"
                  className="absolute start-0 top-full z-[60] mt-1 min-w-[12rem] max-h-[min(70vh,20rem)] overflow-y-auto rounded-lg border border-black/10 bg-white py-2 shadow-xl"
                >
                  <Link
                    href={`/${locale}/blog`}
                    className="block px-4 py-2 text-sm font-medium hover:bg-black/[0.04]"
                    role="menuitem"
                    onClick={() => setPagesOpen(false)}
                  >
                    {t("navArticles")}
                  </Link>
                  {pages.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/${locale}/blog/pages/${p.slug}`}
                      className="block px-4 py-2 text-sm font-medium hover:bg-black/[0.04]"
                      role="menuitem"
                      onClick={() => setPagesOpen(false)}
                    >
                      {p.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <Link
              href={`/${locale}/blog`}
              className={pathWithoutLocale === "/blog" || pathWithoutLocale === "/blog/" ? navActive : navMain}
            >
              {t("template.navBlog")}
            </Link>
            <Link href={`/${locale}/support`} className={pathWithoutLocale.startsWith("/support") ? navActive : navMain}>
              {t("template.navContact")}
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <SiteSocialIcons className="hidden sm:flex" />
            <Link
              href={`/${locale}/order`}
              className="hidden rounded-md bg-[var(--accent)] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-[0_8px_20px_-6px_rgba(232,93,4,0.5)] transition hover:bg-[var(--accent-hover)] sm:inline-flex"
            >
              {t("template.navGetQuote")}
            </Link>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 lg:hidden"
              aria-expanded={mobileOpen}
              aria-label="Menu"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span className="text-lg" aria-hidden>
                {mobileOpen ? "✕" : "☰"}
              </span>
            </button>

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
                  className="absolute end-0 top-full z-[70] mt-1 w-[min(22rem,calc(100vw-1.25rem))] rounded-xl border border-black/10 bg-white p-3 shadow-xl"
                  role="listbox"
                >
                  <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-[#6b6b6b]">{t("language")}</p>
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

        {mobileOpen ? (
          <div className="border-t border-black/[0.06] bg-[#fafafa] px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-1" aria-label={t("navAria")}>
              <Link href={`/${locale}`} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white" onClick={() => setMobileOpen(false)}>
                {t("template.navHome")}
              </Link>
              <Link href={aboutNavHref} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white" onClick={() => setMobileOpen(false)}>
                {t("template.navAbout")}
              </Link>
              <Link href={`/${locale}/order`} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white" onClick={() => setMobileOpen(false)}>
                {t("template.ddRoad")}
              </Link>
              <Link href={`/${locale}/blog`} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white" onClick={() => setMobileOpen(false)}>
                {t("template.navBlog")}
              </Link>
              {pages.map((p) => (
                <Link
                  key={p.slug}
                  href={`/${locale}/blog/pages/${p.slug}`}
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {p.title}
                </Link>
              ))}
              <Link href={`/${locale}/support`} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white" onClick={() => setMobileOpen(false)}>
                {t("template.navContact")}
              </Link>
              <Link
                href={`/${locale}/order`}
                className="mt-2 inline-flex justify-center rounded-md bg-[var(--accent)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white"
                onClick={() => setMobileOpen(false)}
              >
                {t("template.navGetQuote")}
              </Link>
              <SiteSocialIcons className="mt-3 px-3" />
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
