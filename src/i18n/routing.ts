import { defineRouting } from "next-intl/routing";

/** Arabic locale removed from UI; /ar/* redirects to /de in middleware. */
export const locales = ["de", "en", "tr", "fr", "es"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "de",
  localePrefix: "always",
});
