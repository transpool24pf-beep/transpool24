import { defineRouting } from "next-intl/routing";

export const locales = [
  "de",
  "en",
  "tr",
  "fr",
  "es",
  "ar",
  "ru",
  "pl",
  "ro",
  "ku",
  "it",
  "uk",
] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "de",
  localePrefix: "always",
});
