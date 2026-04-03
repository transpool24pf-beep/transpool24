"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
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

/** Order / driver flows: on small screens hide nav (logo + header car only — avoids crowding). */
function isOrderOrDriverFlowPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return false;
  const section = parts[1]!.toLowerCase();
  return section === "order" || section === "driver";
}

/** Single glossy trigger (flag + code + ▾); all locales in a compact panel (reference: classic header dropdown). */
function HeaderLanguageDropdown({
  locale,
  basePath,
  languageLabel,
}: {
  locale: Locale;
  basePath: string;
  languageLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerClass =
    "flex items-center gap-1.5 rounded-lg border border-[#94a3b8]/40 bg-gradient-to-b from-white to-[#e4eaf1] px-2 py-1 text-xs font-bold leading-none text-[#0d2137] shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_1px_4px_rgba(13,33,55,0.09)] ring-1 ring-white/55 transition hover:from-[#fafcff] hover:to-[#dce5f0] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_12px_rgba(13,33,55,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e85d04]/45 active:translate-y-px sm:gap-2 sm:px-2.5 sm:py-1.5 sm:text-sm";

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${languageLabel}: ${LOCALE_NATIVE_LABEL[locale]}`}
      >
        <LocaleFlagIcon locale={locale} />
        <span className="tabular-nums">{LOCALE_SHORT_CODE[locale]}</span>
        <span className="text-[10px] leading-none text-[#0d2137]/55 sm:text-xs" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div
          className="absolute end-0 top-full z-[65] mt-1 w-[min(19rem,calc(100vw-1.25rem))] rounded-xl border border-[#0d2137]/12 bg-gradient-to-b from-white via-[#f6f8fc] to-[#e8edf4] p-2 shadow-[0_18px_50px_-12px_rgba(13,33,55,0.32),inset_0_1px_0_rgba(255,255,255,0.92)] ring-1 ring-white/80"
          role="listbox"
          aria-label={languageLabel}
        >
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-[#0d2137]/48">
            {languageLabel}
          </p>
          <div className="grid max-h-[min(58vh,19rem)] grid-cols-2 gap-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-color:rgba(13,33,55,0.2)_transparent] [scrollbar-width:thin]">
            {locales.map((loc) => (
              <Link
                key={loc}
                href={`/${loc}${basePath === "/" ? "" : basePath}`}
                role="option"
                aria-selected={loc === locale}
                onClick={() => setOpen(false)}
                className={`flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-xs transition sm:text-sm ${
                  loc === locale
                    ? "border border-[#e85d04]/40 bg-gradient-to-b from-white to-[#eef2f8] font-semibold text-[#0d2137] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_4px_rgba(232,93,4,0.15)]"
                    : "border border-transparent hover:border-[#0d2137]/10 hover:bg-[#0d2137]/[0.05]"
                }`}
              >
                <LocaleFlagIcon locale={loc} />
                <span className="min-w-0 flex-1 truncate text-start leading-tight">{LOCALE_NATIVE_LABEL[loc]}</span>
                <span className="shrink-0 tabular-nums text-[10px] font-bold text-[#0d2137]/45 sm:text-xs">
                  {LOCALE_SHORT_CODE[loc]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Header({ hideLogo }: HeaderProps) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const locale = useLocale() as Locale;

  const rtl = locale === "ar" || locale === "ku";

  const showLargeCenterLogo = useMemo(
    () => !hideLogo && isLargeCenterLogoPath(pathname),
    [hideLogo, pathname]
  );

  const hideNavOnMobileOrderDriver = useMemo(() => isOrderOrDriverFlowPath(pathname), [pathname]);

  const pathWithoutLocale = pathname?.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "";
  const basePath = pathWithoutLocale || "/";

  /** Glossy chrome: Drivers secondary pill */
  const navLinkClass =
    "shrink-0 whitespace-nowrap rounded-lg border border-[#0d2137]/14 bg-gradient-to-b from-white to-[#e9ecf1] px-2 py-0.5 text-xs font-medium leading-none text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_1px_2px_rgba(13,33,55,0.06)] transition hover:from-[#fafbfc] hover:to-[#e2e6ec] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_8px_rgba(13,33,55,0.08)] active:translate-y-px sm:px-2.5 sm:py-0.5 sm:text-sm";
  /** Primary CTA: richer gradient; mobile: full label, no wrap, comfortable tap */
  const navCtaClass =
    "relative shrink-0 overflow-hidden whitespace-nowrap rounded-lg border border-[#b84702]/35 bg-gradient-to-b from-[#ffa64d] via-[#e85d04] to-[#c24a03] px-3 py-1 text-[13px] font-semibold leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_10px_rgba(232,93,4,0.42),0_1px_0_rgba(0,0,0,0.12)_inset] ring-1 ring-white/20 transition hover:brightness-[1.06] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_16px_rgba(232,93,4,0.48)] active:translate-y-px active:brightness-[0.98] sm:px-3 sm:py-0.5 sm:text-sm";

  /** Order / driver / blog: prominent centered logo (intrinsic size + max bounds, no short letterbox strip). */
  const centerLogoImgClass =
    "h-auto w-auto max-h-[3.75rem] max-w-[min(90vw,18rem)] object-contain object-center sm:max-h-[4.5rem] sm:max-w-[21rem] md:max-h-[5.35rem] md:max-w-[25rem] lg:max-h-[6rem] lg:max-w-[28rem] xl:max-h-[6.5rem] xl:max-w-[30rem]";

  const homePath = isLocaleHomePath(pathname, locale);

  /** Corner rows: no fixed-height box (avoids empty band above/below wide logo with object-contain). */
  const cornerLogoImgClass = homePath
    ? "h-auto w-auto max-h-[2.55rem] max-w-[9.25rem] object-contain object-start rtl:object-right sm:max-h-[3.35rem] sm:max-w-[min(90vw,17rem)] md:max-h-[3.85rem] md:max-w-[19rem] lg:max-h-[4.35rem] lg:max-w-[21.5rem] xl:max-h-[4.75rem] xl:max-w-[24rem]"
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

  const navWithLang = (
    <div
      className={`shrink-0 flex-nowrap items-center justify-end gap-2 sm:gap-2.5 md:gap-3 ${
        hideNavOnMobileOrderDriver ? "hidden sm:flex" : "flex"
      }`}
    >
      <nav className="flex shrink-0 flex-nowrap items-center gap-2 sm:gap-2.5 md:gap-3">
        <Link href={`/${locale}/driver`} className={navLinkClass}>
          {t("drivers")}
        </Link>
        <Link href={`/${locale}/order`} className={navCtaClass}>
          {t("order")}
        </Link>
      </nav>
      <HeaderLanguageDropdown locale={locale} basePath={basePath} languageLabel={t("language")} />
    </div>
  );

  return (
    <header
      dir={rtl ? "rtl" : "ltr"}
      className="sticky top-0 z-50 relative border-b border-[#0d2137]/10 bg-[var(--background)]"
    >
      <HeaderCarLottieTrack />
      {/* No backdrop-blur / frosted layer — it blurs the DotLottie behind this row */}
      <div className="relative z-10">
        {hideLogo ? (
          <div className="mx-auto flex max-w-6xl items-center justify-end gap-2 px-4 py-0.5 sm:px-6 sm:py-1">
            {navWithLang}
          </div>
        ) : showLargeCenterLogo ? (
          <div
            className={`mx-auto grid w-full max-w-6xl items-center gap-2 px-4 py-1 sm:gap-3 sm:px-6 sm:py-1.5 md:py-2 ${
              hideNavOnMobileOrderDriver
                ? "max-sm:grid-cols-1 max-sm:justify-items-center sm:grid-cols-[1fr_auto_1fr]"
                : "grid-cols-[1fr_auto_1fr]"
            }`}
          >
            <div
              className={`min-w-0 ${hideNavOnMobileOrderDriver ? "hidden sm:block" : ""}`}
              aria-hidden
            />
            <Link
              href={`/${locale}`}
              className="flex justify-center justify-self-center"
              aria-label="TransPool24"
            >
              <span className="relative inline-flex shrink-0 items-center justify-center">{logoImageCenter}</span>
            </Link>
            <div
              className={`min-w-0 justify-self-end ${hideNavOnMobileOrderDriver ? "hidden sm:block" : ""}`}
            >
              {navWithLang}
            </div>
          </div>
        ) : (
          <div
            className={`flex w-full min-w-0 items-center justify-between gap-2 sm:gap-3 ${
              homePath
                ? "py-1 ps-1.5 pe-2 sm:py-1.5 sm:ps-2 sm:pe-4 md:pe-5"
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
            {navWithLang}
          </div>
        )}
      </div>
    </header>
  );
}
