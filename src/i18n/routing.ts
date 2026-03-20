import { defineRouting } from "next-intl/routing";

export const locales = ["de", "en", "tr", "fr", "es", "ar"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "de",
  localePrefix: "always",
});
