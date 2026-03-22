import type { WhyPagePayload } from "./why-transpool24-types";
import { whyPageAr } from "./why-defaults-ar";
import { whyPageDe } from "./why-defaults-de";
import { whyPageEn } from "./why-defaults-en";
import type { Locale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";

export const WHY_PAGE_DEFAULTS: Record<Locale, WhyPagePayload> = {
  de: whyPageDe,
  en: whyPageEn,
  ar: whyPageAr,
  tr: whyPageEn,
  fr: whyPageEn,
  es: whyPageEn,
  ru: whyPageEn,
  pl: whyPageEn,
  ro: whyPageEn,
  ku: whyPageEn,
  it: whyPageEn,
  uk: whyPageEn,
};

export function defaultWhyPayloadForLocale(locale: string): WhyPagePayload {
  const l = locales.includes(locale as Locale) ? (locale as Locale) : "de";
  return WHY_PAGE_DEFAULTS[l];
}
