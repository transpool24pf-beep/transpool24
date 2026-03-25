"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function BlogFooter() {
  const t = useTranslations("blog");
  const locale = useLocale();

  return (
    <footer className="mt-auto border-t border-[#0d2137]/10 bg-[#0d2137] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">{t("magazineBadge")}</p>
            <p className="mt-2 text-lg font-bold text-white">{t("magazineTitle")}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">{t("footerBlurb")}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">{t("footerEditorsTitle")}</p>
            <p className="mt-3 text-sm text-white/80">{t("footerEditorsLine")}</p>
            <Link
              href="/admin/blog"
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              {t("linkAdmin")}
              <span aria-hidden className="text-white/60">
                →
              </span>
            </Link>
            <p className="mt-2 text-xs text-white/45">/admin/login</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-1 lg:text-end">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">TransPool24</p>
            <div className="mt-3 flex flex-col gap-2 text-sm sm:items-end">
              <Link href={`/${locale}`} className="font-medium text-[var(--accent)] hover:underline">
                {t("toCompanySite")}
              </Link>
              <Link href={`/${locale}/privacy`} className="text-white/80 hover:text-white hover:underline">
                {t("linkPrivacy")}
              </Link>
              <Link href={`/${locale}/support`} className="text-white/80 hover:text-white hover:underline">
                {t("linkContact")}
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/45">
          {t("footerDisclaimer")}
        </p>
      </div>
    </footer>
  );
}
