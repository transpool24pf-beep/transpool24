import type { Locale } from "@/i18n/routing";

const MAP: Record<Locale, string> = {
  de: "de-DE",
  en: "en-GB",
  tr: "tr-TR",
  fr: "fr-FR",
  es: "es-ES",
  ar: "ar-SA",
  ru: "ru-RU",
  pl: "pl-PL",
  ro: "ro-RO",
  ku: "ku-TR",
  it: "it-IT",
  uk: "uk-UA",
};

/** BCP 47 tag for Intl date/number formatting from site path locale. */
export function bcp47ForSiteLocale(locale: string): string {
  return (MAP as Record<string, string>)[locale] ?? "en-GB";
}
