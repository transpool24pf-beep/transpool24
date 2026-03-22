import type { Locale } from "@/i18n/routing";

/** Native / end-user label for each site locale (header & footer menus). */
export const LOCALE_NATIVE_LABEL: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  tr: "Türkçe",
  fr: "Français",
  es: "Español",
  ar: "العربية",
  ru: "Русский",
  pl: "Polski",
  ro: "Română",
  ku: "Kurdî (Kurmancî)",
  it: "Italiano",
  uk: "Українська",
};

/** Short code on the compact header trigger (e.g. DE, EN). */
export const LOCALE_SHORT_CODE: Record<Locale, string> = {
  de: "DE",
  en: "EN",
  tr: "TR",
  fr: "FR",
  es: "ES",
  ar: "AR",
  ru: "RU",
  pl: "PL",
  ro: "RO",
  ku: "KU",
  it: "IT",
  uk: "UK",
};

/** Emoji flags; Kurdish uses `/399.png.png` in `LocaleFlagIcon` instead. */
export const LOCALE_EMOJI_FLAG: Record<Locale, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
  tr: "🇹🇷",
  fr: "🇫🇷",
  es: "🇪🇸",
  ar: "🇸🇦",
  ru: "🇷🇺",
  pl: "🇵🇱",
  ro: "🇷🇴",
  ku: "",
  it: "🇮🇹",
  uk: "🇺🇦",
};

/** Label for `<option>` in Website CMS (emoji + name + code; Kurdish has no emoji, use name + code). */
export function localeCmsSelectLabel(l: Locale): string {
  const code = LOCALE_SHORT_CODE[l];
  const name = LOCALE_NATIVE_LABEL[l];
  if (l === "ku") return `${name} (${code})`;
  return `${LOCALE_EMOJI_FLAG[l]} ${name} (${code})`;
}
