import type { Locale } from "@/i18n/routing";

/** Stable labels so browser page-translate does not corrupt ISO codes (e.g. es/it → wrong Arabic). */
export const LOCALE_OPTION_LABEL: Record<Locale, string> = {
  de: "Deutsch — de",
  en: "English — en",
  tr: "Türkçe — tr",
  fr: "Français — fr",
  es: "Español — es",
  ar: "العربية — ar",
  ru: "Русский — ru",
  pl: "Polski — pl",
  ro: "Română — ro",
  ku: "Kurdî — ku",
  it: "Italiano — it",
  uk: "Українська — uk",
};

export function localeSelectLabel(loc: Locale): string {
  return LOCALE_OPTION_LABEL[loc] ?? loc;
}
