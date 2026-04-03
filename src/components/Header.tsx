"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useRef, useEffect, useMemo } from "react";
import { locales, type Locale } from "@/i18n/routing";
import { LOCALE_NATIVE_LABEL, LOCALE_SHORT_CODE } from "@/lib/locale-display";
import { LocaleFlagIcon } from "@/components/LocaleFlagIcon";
import { HeaderCarLottieTrack } from "@/components/HeaderCarLottieTrack";

type HeaderProps = { hideLogo?: boolean };

/** Locale is first segment; home is exactly `/{locale}` (avoids regex edge cases with usePathname). */
function isLocaleHomePath(pathname: string | null, locale: string): boolean {
  if (!pathname) return false;
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 1 && parts[0]!.toLowerCase() === locale.toLowerCase();
}

/** Order, drivers, magazine: large centered logo (segment-based; reliable with usePathname). */
function isLargeCenterLogoPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return false;
  const section = parts[1]!.toLowerCase();
  return section === "order" || section === "driver" || section === "blog";
}

export function Header({ hideLogo }: HeaderProps) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const rtl = locale === "ar" || locale === "ku";

  const showLargeCenterLogo = useMemo(
    () => !hideLogo && isLargeCenterLogoPath(pathname),
    [hideLogo, pathname]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pathWithoutLocale = pathname?.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "";
  const basePath = pathWithoutLocale || "/";

  const navLinkClass =
    "rounded-lg border border-[#0d2137]/15 px-2 py-0.5 text-sm font-medium leading-none text-[var(--foreground)] transition hover:bg-[#0d2137]/5 sm:px-2.5 sm:py-0.5";
  const navCtaClass =
    "rounded-lg bg-[var(--accent)] px-2.5 py-0.5 text-sm font-medium leading-none text-white transition hover:opacity-90 sm:px-3 sm:py-0.5";
  const langBtnClass =
    "flex items-center gap-1.5 rounded-lg border border-[#0d2137]/20 px-2 py-0.5 text-sm font-medium leading-none text-[var(--foreground)] sm:gap-2 sm:px-2 sm:py-0.5";

  /** Order / driver / blog: prominent centered logo (intrinsic size + max bounds, no short letterbox strip). */
  const centerLogoImgClass =
    "h-auto w-auto max-h-[3.75rem] max-w-[min(90vw,18rem)] object-contain object-center sm:max-h-[4.5rem] sm:max-w-[21rem] md:max-h-[5.35rem] md:max-w-[25rem] lg:max-h-[6rem] lg:max-w-[28rem] xl:max-h-[6.5rem] xl:max-w-[30rem]";

  const homePath = isLocaleHomePath(pathname, locale);

  /** Corner rows: no fixed-height box (avoids empty band above/below wide logo with object-contain). */
  const cornerLogoImgClass = homePath
    ? "h-auto w-auto max-h-[3.35rem] max-w-[min(90vw,17rem)] object-contain object-start rtl:object-right sm:max-h-[3.85rem] sm:max-w-[19rem] md:max-h-[4.35rem] md:max-w-[21.5rem] lg:max-h-[4.75rem] lg:max-w-[24rem]"
    : "h-auto w-auto max-h-[2.2rem] max-w-[min(56vw,8.75rem)] object-contain object-start rtl:object-right sm:max-h-[2.4rem] sm:max-w-[9.75rem] md:max-h-[2.55rem]";

  const logoImageCenter = (
    <Image
      src="/5439.png"
      alt="TransPool24"
      width={1024}
      height={558}
      quality={100}
      className={centerLogoImgClass}
      priority={showLargeCenterLogo}
      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 25rem, 30rem"
    />
  );

  const logoImageCorner = (
    <Image
      src="/5439.png"
      alt="TransPool24"
      width={1024}
      height={558}
      quality={100}
      className={cornerLogoImgClass}
      priority={homePath}
      sizes={
        homePath
          ? "(max-width: 640px) 90vw, (max-width: 1024px) 20rem, 24rem"
          : "(max-width: 640px) 56vw, (max-width: 1024px) 10rem, 11rem"
      }
    />
  );

  const nav = (
    <nav className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2 md:gap-2.5">
      <Link href={`/${locale}/blog`} className={navLinkClass}>
        {t("blog")}
      </Link>
      <Link href={`/${locale}/driver`} className={navLinkClass}>
        {t("drivers")}
      </Link>
      <Link href={`/${locale}/order`} className={navCtaClass}>
        {t("order")}
      </Link>
      <div className="relative shrink-0" ref={ref}>
        <button
          type="button"
          onClick={() => setLangOpen((o) => !o)}
          className={langBtnClass}
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
  );

  return (
    <header
      dir={rtl ? "rtl" : "ltr"}
      className="sticky top-0 z-50 relative overflow-hidden border-b border-[#0d2137]/10 bg-[var(--background)]"
    >
      <HeaderCarLottieTrack />
      {/* No backdrop-blur / frosted layer — it blurs the DotLottie behind this row */}
      <div className="relative z-10">
        {hideLogo ? (
          <div className="mx-auto flex max-w-6xl items-center justify-end gap-2 px-4 py-0.5 sm:px-6 sm:py-1">
            {nav}
          </div>
        ) : showLargeCenterLogo ? (
          <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-1 sm:gap-3 sm:px-6 sm:py-1.5 md:py-2">
            <div className="min-w-0" aria-hidden />
            <Link
              href={`/${locale}`}
              className="flex justify-center justify-self-center"
              aria-label="TransPool24"
            >
              <span className="relative inline-flex shrink-0 items-center justify-center">{logoImageCenter}</span>
            </Link>
            <div className="min-w-0 justify-self-end">{nav}</div>
          </div>
        ) : (
          <div
            className={`flex w-full items-center justify-between gap-2 sm:gap-3 ${
              homePath
                ? "py-1 ps-1.5 pe-3 sm:py-1.5 sm:ps-2 sm:pe-4 md:pe-5"
                : "mx-auto max-w-6xl px-4 py-0 sm:px-6 sm:py-0.5"
            }`}
          >
            <Link
              href={`/${locale}`}
              className={
                homePath
                  ? "-ms-0.5 flex shrink-0 items-center sm:-ms-1"
                  : "flex min-w-0 shrink-0 items-center"
              }
              aria-label="TransPool24"
            >
              <span className="relative inline-flex shrink-0 items-center">{logoImageCorner}</span>
            </Link>
            {nav}
          </div>
        )}
      </div>
    </header>
  );
}
