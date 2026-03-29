"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { cookieConsentCopy } from "@/lib/cookie-consent-copy";

const STORAGE_KEY = "tp24_cookie_consent";
const CONSENT_VERSION = 1;

/** Reference-style primary CTA (sage green) */
const BTN_PRIMARY = "#a8cf82";
const BAR_BG = "#1c2b4b";
const PANEL_BG = "#152238";

export type CookieConsentPreferences = {
  version: number;
  essential: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: number;
};

function parseStored(raw: string | null): CookieConsentPreferences | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<CookieConsentPreferences>;
    if (p.version !== CONSENT_VERSION || typeof p.analytics !== "boolean" || typeof p.marketing !== "boolean") {
      return null;
    }
    return {
      version: CONSENT_VERSION,
      essential: true,
      analytics: p.analytics,
      marketing: p.marketing,
      decidedAt: typeof p.decidedAt === "number" ? p.decidedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

function persistChoice(analytics: boolean, marketing: boolean) {
  const full: CookieConsentPreferences = {
    version: CONSENT_VERSION,
    essential: true,
    analytics,
    marketing,
    decidedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<CookieConsentPreferences>("tp24:cookie-consent", { detail: full }));
  }
}

export function readCookieConsentFromStorage(): CookieConsentPreferences | null {
  if (typeof window === "undefined") return null;
  return parseStored(localStorage.getItem(STORAGE_KEY));
}

/**
 * Mandatory cookie layer: dimmed backdrop + full-width bottom bar (professional layout).
 * Logo: /356.png in public.
 */
export function CookieConsentBarrier() {
  const locale = useLocale();
  const t = cookieConsentCopy(locale);
  const isRtl = locale === "ar" || locale === "ku";

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(false);
  const [marketingOn, setMarketingOn] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = parseStored(localStorage.getItem(STORAGE_KEY));
    setVisible(!existing);
  }, []);

  useEffect(() => {
    if (!visible) {
      document.body.style.overflow = "";
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const finish = useCallback((analytics: boolean, marketing: boolean) => {
    persistChoice(analytics, marketing);
    setVisible(false);
    setCustomize(false);
  }, []);

  const openCustomize = useCallback(() => {
    setCustomize(true);
    setAnalyticsOn(false);
    setMarketingOn(false);
  }, []);

  if (!mounted || !visible) return null;

  const privacyHref = `/${locale}/privacy`;

  return (
    <div
      className="fixed inset-0 z-[100000]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={customize ? "tp24-cookie-panel-title" : "tp24-cookie-title"}
      aria-describedby={customize ? undefined : "tp24-cookie-desc"}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" aria-hidden />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end">
        <div className="pointer-events-auto flex max-h-[calc(100dvh-0.5rem)] w-full flex-col">
          {customize ? (
            <div
              className="max-h-[min(50vh,26rem)] overflow-y-auto border-t border-white/10 shadow-[0_-12px_40px_rgba(0,0,0,0.28)]"
              style={{ backgroundColor: PANEL_BG }}
            >
              <div className="px-5 py-5 sm:px-8 lg:px-10">
                <h2 id="tp24-cookie-panel-title" className="text-lg font-bold text-white sm:text-xl">
                  {t.customizeTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{t.body}</p>
                <ul className="mt-4 space-y-3">
                  <li className="rounded-lg border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{t.necessaryTitle}</p>
                        <p className="mt-1 text-sm text-white/60">{t.necessaryDesc}</p>
                      </div>
                      <span className="shrink-0 rounded bg-white/10 px-2 py-1 text-xs font-medium text-white/75">
                        {t.necessaryBadge}
                      </span>
                    </div>
                  </li>
                  <li className="rounded-lg border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                    <ToggleRow
                      title={t.analyticsTitle}
                      description={t.analyticsDesc}
                      checked={analyticsOn}
                      onChange={setAnalyticsOn}
                    />
                  </li>
                  <li className="rounded-lg border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                    <ToggleRow
                      title={t.marketingTitle}
                      description={t.marketingDesc}
                      checked={marketingOn}
                      onChange={setMarketingOn}
                    />
                  </li>
                </ul>
                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setCustomize(false)}
                    className="rounded-md border border-white/25 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    {t.back}
                  </button>
                  <button
                    type="button"
                    onClick={() => finish(analyticsOn, marketingOn)}
                    className="rounded-md px-4 py-2.5 text-sm font-bold text-[#171717] hover:brightness-105"
                    style={{ backgroundColor: BTN_PRIMARY }}
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div
            className="border-t border-white/15 shadow-[0_-20px_50px_rgba(0,0,0,0.4)]"
            style={{ backgroundColor: BAR_BG }}
          >
            <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:gap-8 lg:px-10 lg:py-9 xl:gap-12 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
              {/* Logo */}
              <div className="flex shrink-0 justify-center lg:justify-start">
                <div className="relative h-[52px] w-[min(100%,220px)] sm:h-14 sm:w-56">
                  <Image
                    src="/356.png"
                    alt="TransPool24"
                    fill
                    className="object-contain object-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] lg:object-left rtl:lg:object-right"
                    sizes="(max-width: 768px) 220px, 224px"
                    priority
                  />
                </div>
              </div>

              {/* Copy */}
              <div className="min-w-0 flex-1 text-center lg:text-start">
                {!customize ? (
                  <>
                    <h2 id="tp24-cookie-title" className="text-lg font-bold leading-snug text-white sm:text-xl">
                      {t.title}
                    </h2>
                    <p className="mt-1 text-sm text-white/80">{t.lead}</p>
                    <p id="tp24-cookie-desc" className="mt-3 text-sm leading-relaxed text-white/85">
                      {t.bodyShort}
                      <Link
                        href={privacyHref}
                        className="font-semibold text-[var(--accent)] underline decoration-[var(--accent)]/60 underline-offset-2 hover:text-[var(--accent-hover)]"
                      >
                        {t.policyLabel}
                      </Link>
                      .
                    </p>
                    <button
                      type="button"
                      onClick={openCustomize}
                      className="mt-3 text-sm font-medium text-white/95 underline decoration-white/40 underline-offset-4 transition hover:decoration-white"
                    >
                      {t.showDetails}
                    </button>
                  </>
                ) : (
                  <p className="text-sm leading-relaxed text-white/80">{t.customizeTitle}</p>
                )}
              </div>

              {/* Actions */}
              {!customize ? (
                <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center lg:w-auto lg:min-w-[220px] lg:flex-col lg:justify-center xl:min-w-[240px]">
                  <button
                    type="button"
                    onClick={() => finish(true, true)}
                    className="order-1 w-full rounded-md px-5 py-3 text-center text-sm font-bold text-[#171717] shadow-sm transition hover:brightness-105 sm:order-2 lg:order-1"
                    style={{ backgroundColor: BTN_PRIMARY }}
                  >
                    {t.acceptAll}
                  </button>
                  <button
                    type="button"
                    onClick={() => finish(false, false)}
                    className="order-2 w-full rounded-md border-2 border-white bg-transparent px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10 sm:order-1 lg:order-2"
                  >
                    {t.essentialOnlyBtn}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm text-white/60">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors ${
          checked ? "border-[var(--accent)] bg-[var(--accent)]/25" : "border-white/25 bg-white/5"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            checked ? "start-[calc(100%-1.75rem)]" : "start-0.5"
          }`}
        />
      </button>
    </div>
  );
}
