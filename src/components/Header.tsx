"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { locales, type Locale } from "@/i18n/routing";
import { LOCALE_NATIVE_LABEL, LOCALE_SHORT_CODE } from "@/lib/locale-display";
import { LocaleFlagIcon } from "@/components/LocaleFlagIcon";

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
      <div className="mx-auto grid min-h-[4.75rem] max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2 sm:min-h-[5.25rem] sm:gap-3 sm:px-6 md:min-h-[6rem]">
        <div className="min-w-0" aria-hidden />
        {!hideLogo ? (
          <Link
            href={`/${locale}`}
            className="flex justify-center justify-self-center py-0.5"
            aria-label="TransPool24"
          >
            <span className="relative block h-[3.25rem] w-[min(88vw,17.5rem)] sm:h-[3.875rem] sm:w-[min(88vw,20rem)] md:h-[4.5rem] md:w-[min(90vw,22rem)] lg:h-[5rem] lg:w-[min(92vw,24rem)]">
              <Image
                src="/5439.png"
                alt="TransPool24"
                width={1024}
                height={558}
                quality={100}
                className="h-full w-full object-contain object-center"
                priority
                sizes="(max-width: 640px) 88vw, (max-width: 1024px) 20rem, 24rem"
              />
            </span>
          </Link>
        ) : (
          <div
            className="h-[3.25rem] w-[min(88vw,17.5rem)] justify-self-center sm:h-[3.875rem] sm:w-[min(88vw,20rem)] md:h-[4.5rem] md:w-[min(90vw,22rem)] lg:h-[5rem] lg:w-[min(92vw,24rem)]"
            aria-hidden
          />
        )}
        <nav className="flex min-w-0 items-center justify-end justify-self-end gap-2 sm:gap-4">
          <Link
            href={`/${locale}/blog`}
            className="rounded-lg border border-[#0d2137]/15 px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[#0d2137]/5 sm:px-4"
          >
            {t("blog")}
          </Link>
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
              className="flex items-center gap-2 rounded-lg border border-[#0d2137]/20 px-2.5 py-2 text-sm font-medium text-[var(--foreground)]"
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              aria-label={`${t("language")}: ${LOCALE_NATIVE_LABEL[locale]}`}
            >
              <LocaleFlagIcon locale={locale} />
              <span className="tabular-nums">{LOCALE_SHORT_CODE[locale]}</span>
              <span className="text-[10px] leading-none text-[#0d2137]/70" aria-hidden>
                ▾
              </span>
            </button>
            {langOpen && (
              <div
                className="absolute right-0 top-full z-[60] mt-1 w-[min(22rem,calc(100vw-1.25rem))] rounded-xl border border-[#0d2137]/10 bg-[var(--background)] p-3 shadow-lg"
                role="listbox"
              >
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#0d2137]/55">
                  {t("language")}
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {locales.map((loc) => (
                    <Link
                      key={loc}
                      href={`/${loc}${basePath === "/" ? "" : basePath}`}
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
        </nav>
      </div>
    </header>
  );
}
