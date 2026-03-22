import type { WhyPagePayload } from "./why-transpool24-types";
import { whyPageAr } from "./why-defaults-ar";
import { whyPageDe } from "./why-defaults-de";
import { whyPageEn } from "./why-defaults-en";
import { whyPageEs } from "./why-defaults-es";
import { whyPageFr } from "./why-defaults-fr";
import { whyPageIt } from "./why-defaults-it";
import { whyPageKu } from "./why-defaults-ku";
import { whyPagePl } from "./why-defaults-pl";
import { whyPageRo } from "./why-defaults-ro";
import { whyPageRu } from "./why-defaults-ru";
import { whyPageTr } from "./why-defaults-tr";
import { whyPageUk } from "./why-defaults-uk";
import type { Locale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";

export const WHY_PAGE_DEFAULTS: Record<Locale, WhyPagePayload> = {
  de: whyPageDe,
  en: whyPageEn,
  tr: whyPageTr,
  fr: whyPageFr,
  es: whyPageEs,
  ar: whyPageAr,
  ru: whyPageRu,
  pl: whyPagePl,
  ro: whyPageRo,
  ku: whyPageKu,
  it: whyPageIt,
  uk: whyPageUk,
};

export function defaultWhyPayloadForLocale(locale: string): WhyPagePayload {
  const l = locales.includes(locale as Locale) ? (locale as Locale) : "de";
  return WHY_PAGE_DEFAULTS[l];
}
