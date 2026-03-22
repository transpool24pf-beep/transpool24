import type { Locale } from "@/i18n/routing";
import { LOCALE_NATIVE_LABEL } from "@/lib/locale-display";

const CMS_LOCALE_ORDER = [
  "de",
  "en",
  "ar",
  "fr",
  "es",
  "tr",
  "ru",
  "pl",
  "ro",
  "ku",
  "it",
  "uk",
] as const satisfies readonly Locale[];

/** Labels for Website CMS forms (hero, etc.) — same native names as the public language menu. */
export const WEBSITE_CMS_LOCALE_OPTIONS: { code: Locale; label: string }[] = CMS_LOCALE_ORDER.map(
  (code) => ({ code, label: LOCALE_NATIVE_LABEL[code] }),
);
