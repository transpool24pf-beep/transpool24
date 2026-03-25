"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";
import { LOCALE_NATIVE_LABEL, LOCALE_SHORT_CODE } from "@/lib/locale-display";
import { LocaleFlagIcon } from "@/components/LocaleFlagIcon";

type NavPage = { slug: string; title: string; nav_order: number };

function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <a
        href="https://facebook.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/80 transition hover:text-white"
        aria-label="Facebook"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>
      <a
        href="https://twitter.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/80 transition hover:text-white"
        aria-label="X"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <a
        href="https://linkedin.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/80 transition hover:text-white"
        aria-label="LinkedIn"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>
      <a
        href="https://instagram.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/80 transition hover:text-white"
        aria-label="Instagram"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      </a>
    </div>
  );
}

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

  const navMain =
    "rounded-md px-3 py-2 text-sm font-semibold text-[#2d2d2d] transition hover:bg-black/[0.04] hover:text-[#1a1a1a]";
  const navActive = "rounded-md bg-[var(--accent)]/12 px-3 py-2 text-sm font-bold text-[var(--accent)]";

  return (
    <header className="sticky top-0 z-50 bg-white text-[#1a1a1a] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]">
      {/* Top bar — template */}
      <div className="bg-[#222] text-[11px] text-white/90 sm:text-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a href={`mailto:${t("template.topEmail")}`} className="inline-flex items-center gap-1.5 hover:text-white">
              <span aria-hidden>✉</span>
              <span className="break-all">{t("template.topEmail")}</span>
            </a>
            <a href={`tel:${t("template.topPhone").replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-white">
              <span aria-hidden>☎</span>
              {t("template.topPhone")}
            </a>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span aria-hidden>⌖</span>
              {t("template.topAddress")}
            </span>
          </div>
          <SocialLinks className="shrink-0" />
        </div>
      </div>

      {/* Main navbar */}
      <div className="border-b border-black/[0.08] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2 py-1" aria-label={t("template.logoWordmark")}>
            <span className="rounded-md bg-[var(--accent)] px-2.5 py-1 text-lg font-black leading-none text-white">T</span>
            <span className="text-lg font-extrabold tracking-tight text-[#1a1a1a]">{t("template.logoWordmark")}</span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t("navAria")}>
            <Link href={`/${locale}`} className={pathWithoutLocale === "/" || pathWithoutLocale === "" ? navActive : navMain}>
              {t("template.navHome")}
            </Link>
            <Link href={`/${locale}/why`} className={pathWithoutLocale.startsWith("/why") ? navActive : navMain}>
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
              <Link href={`/${locale}/why`} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white" onClick={() => setMobileOpen(false)}>
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
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
