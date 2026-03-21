"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { locales, type Locale } from "@/i18n/routing";

const localeFlags: Record<Locale, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
  tr: "🇹🇷",
  fr: "🇫🇷",
  es: "🇪🇸",
  ar: "🇸🇦",
};

const localeLabels: Record<Locale, string> = {
  de: "DE",
  en: "EN",
  tr: "TR",
  fr: "FR",
  es: "ES",
  ar: "AR",
};

type HeaderProps = { hideLogo?: boolean };

export function Header({ hideLogo }: HeaderProps) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pathWithoutLocale = pathname?.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "";
  const basePath = pathWithoutLocale || "/";

  return (
    <header className="sticky top-0 z-50 border-b border-[#0d2137]/10 bg-[var(--background)]/95 backdrop-blur">
      <div className="mx-auto flex min-h-[4.25rem] items-center justify-between px-4 py-2 sm:px-6 max-w-6xl">
        {!hideLogo ? (
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="TransPool24"
              width={64}
              height={64}
              className="h-14 w-14 object-contain sm:h-16 sm:w-16"
              priority
            />
            <span className="text-xl font-semibold text-[var(--primary)] sm:text-2xl">
              Trans<span className="text-[var(--accent)]">Pool</span>24
            </span>
          </Link>
        ) : (
          <div className="w-[180px]" aria-hidden />
        )}
        <nav className="flex items-center gap-4">
          <Link
            href={`/${locale}/driver`}
            className="rounded-lg border border-[#0d2137]/15 px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[#0d2137]/5"
          >
            {t("drivers")}
          </Link>
          <Link
            href={`/${locale}/order`}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            {t("order")}
          </Link>
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1 rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm font-medium text-[var(--foreground)]"
            >
              {localeLabels[locale]} ▾
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-[#0d2137]/10 bg-[var(--background)] py-1 shadow-lg">
                {locales.map((loc) => (
                  <Link
                    key={loc}
                    href={`/${loc}${basePath === "/" ? "" : basePath}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#0d2137]/5"
                    onClick={() => setLangOpen(false)}
                  >
                    <span className="text-base">{localeFlags[loc]}</span>
                    {localeLabels[loc]}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
