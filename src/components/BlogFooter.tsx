"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getPublicContactEmail, getPublicContactMailto, getPublicContactPhone, getPublicContactTelHref } from "@/lib/site-contact";
import { BrandWordmark } from "@/components/BrandWordmark";
import { SiteSocialIcons } from "@/components/SiteSocialIcons";

export function BlogFooter() {
  const t = useTranslations("blog");
  const locale = useLocale();
  const year = new Date().getFullYear();
  const rtl = locale === "ar" || locale === "ku";

  return (
    <footer className="mt-auto bg-[#1a1a1a] text-white" dir={rtl ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div>
            <Link href={`/${locale}`} className="inline-flex items-center" aria-label="TransPool24">
              <BrandWordmark className="text-[1.45rem]" onDark />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/75">{t("footerBlurb")}</p>
            <SiteSocialIcons
              className="mt-6"
              iconClassName="h-5 w-5"
              linkClassName="text-white/70 transition hover:text-[var(--accent)]"
            />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white">{t("template.footerCol2Title")}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li>
                <Link href={`/${locale}/order`} className="hover:text-[var(--accent)] hover:underline">
                  {t("template.footerSvc1")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/why`} className="hover:text-[var(--accent)] hover:underline">
                  {t("template.footerSvc2")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/order`} className="hover:text-[var(--accent)] hover:underline">
                  {t("template.footerSvc3")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/why`} className="hover:text-[var(--accent)] hover:underline">
                  {t("template.footerSvc4")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white">{t("template.footerCol3Title")}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li>
                <Link href={`/${locale}`} className="hover:text-[var(--accent)] hover:underline">
                  {t("template.footerQuick1")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/why`} className="hover:text-[var(--accent)] hover:underline">
                  {t("template.footerQuick2")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/blog`} className="hover:text-[var(--accent)] hover:underline">
                  {t("template.footerQuick3")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="hover:text-[var(--accent)] hover:underline">
                  {t("template.footerQuick4")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white">{t("template.footerCol4Title")}</p>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li className="flex gap-2">
                <span aria-hidden>⌖</span>
                <span>{t("template.touchAddress")}</span>
              </li>
              <li>
                <a href={getPublicContactTelHref()} className="hover:text-[var(--accent)] hover:underline" dir="ltr">
                  {getPublicContactPhone()}
                </a>
              </li>
              <li>
                <a href={getPublicContactMailto()} className="hover:text-[var(--accent)] hover:underline">
                  {getPublicContactEmail()}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-white/35">
          {t("footerDisclaimer")}
        </p>
        <div className="mt-6 border-t border-black/50 bg-[#12151a]">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-center text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-start">
            <p>{t("template.footerCopyright", { year })}</p>
            <p className="text-white/45">{t("template.footerDeveloperCredit")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
