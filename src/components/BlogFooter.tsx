"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function BlogFooter() {
  const t = useTranslations("blog");
  const locale = useLocale();

  return (
    <footer className="mt-auto border-t border-[#0d2137]/10 bg-[#f0f2f5] px-4 py-10 text-sm text-[#0d2137]/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-[#0d2137]">{t("magazineTitle")}</p>
          <p className="mt-2 max-w-md leading-relaxed">{t("footerBlurb")}</p>
        </div>
        <div className="flex flex-col gap-2 sm:text-end">
          <Link href={`/${locale}`} className="font-medium text-[var(--accent)] hover:underline">
            {t("toCompanySite")}
          </Link>
          <Link href={`/${locale}/privacy`} className="hover:text-[#0d2137] hover:underline">
            {t("linkPrivacy")}
          </Link>
          <Link href={`/${locale}/support`} className="hover:text-[#0d2137] hover:underline">
            {t("linkContact")}
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs text-[#0d2137]/50">{t("footerDisclaimer")}</p>
    </footer>
  );
}
