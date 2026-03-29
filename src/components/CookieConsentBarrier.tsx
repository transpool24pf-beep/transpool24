"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { cookieConsentCopy } from "@/lib/cookie-consent-copy";

const STORAGE_KEY = "tp24_cookie_consent";
const CONSENT_VERSION = 1;

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
 * Mandatory full-screen consent layer on public locale routes until the user chooses.
 * Blocks interaction with the page behind (no dismiss on backdrop).
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

  if (!mounted || !visible) return null;

  const privacyHref = `/${locale}/privacy`;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tp24-cookie-title"
      aria-describedby={customize ? undefined : "tp24-cookie-desc"}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Backdrop: mandatory — does not close on click */}
      <div className="absolute inset-0 bg-[#05070a]/85 backdrop-blur-[2px]" aria-hidden />

      <div className="relative w-full max-w-[min(100%,32rem)] sm:max-w-xl rounded-2xl border border-white/[0.12] bg-gradient-to-b from-[#12171f] via-[#0e1218] to-[#0a0d11] shadow-[0_25px_80px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
        <div className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/20 ring-1 ring-[var(--accent)]/40 sm:left-5 sm:top-5">
          <span className="text-lg font-bold text-[var(--accent)]" aria-hidden>
            C
          </span>
        </div>

        <div className="px-5 pb-5 pt-14 sm:px-7 sm:pb-7 sm:pt-16">
          {!customize ? (
            <>
              <h2 id="tp24-cookie-title" className="text-lg font-bold tracking-tight text-white sm:text-xl">
                {t.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-white/75">{t.lead}</p>
              <p id="tp24-cookie-desc" className="mt-3 text-sm leading-relaxed text-white/65">
                {t.body}
                <Link
                  href={privacyHref}
                  className="font-semibold text-[var(--accent)] underline decoration-[var(--accent)]/50 underline-offset-2 hover:text-[var(--accent-hover)] hover:decoration-[var(--accent)]"
                >
                  {t.policyLabel}
                </Link>
                .
              </p>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={() => finish(false, false)}
                  className="order-3 rounded-xl border-2 border-[var(--accent)]/80 bg-transparent px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06] sm:order-1"
                >
                  {t.reject}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomize(true);
                    setAnalyticsOn(false);
                    setMarketingOn(false);
                  }}
                  className="order-2 rounded-xl border-2 border-[var(--accent)]/80 bg-transparent px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                >
                  {t.customize}
                </button>
                <button
                  type="button"
                  onClick={() => finish(true, true)}
                  className="order-1 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] sm:order-3"
                >
                  {t.acceptAll}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 id="tp24-cookie-title" className="text-lg font-bold text-white sm:text-xl">
                {t.customizeTitle}
              </h2>
              <ul className="mt-4 space-y-4">
                <li className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{t.necessaryTitle}</p>
                      <p className="mt-1 text-sm text-white/60">{t.necessaryDesc}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white/70">
                      {t.necessaryBadge}
                    </span>
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <ToggleRow
                    title={t.analyticsTitle}
                    description={t.analyticsDesc}
                    checked={analyticsOn}
                    onChange={setAnalyticsOn}
                  />
                </li>
                <li className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <ToggleRow
                    title={t.marketingTitle}
                    description={t.marketingDesc}
                    checked={marketingOn}
                    onChange={setMarketingOn}
                  />
                </li>
              </ul>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setCustomize(false)}
                  className="rounded-xl border-2 border-white/20 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/[0.06]"
                >
                  {t.back}
                </button>
                <button
                  type="button"
                  onClick={() => finish(analyticsOn, marketingOn)}
                  className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                >
                  {t.save}
                </button>
              </div>
            </>
          )}
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
          checked ? "border-[var(--accent)] bg-[var(--accent)]/30" : "border-white/25 bg-white/5"
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
