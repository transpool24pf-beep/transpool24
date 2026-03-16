import { defineRouting } from "next-intl/routing";

export const locales = ["de", "ar", "en", "tr", "fr", "es"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "de",
  localePrefix: "always",
});
