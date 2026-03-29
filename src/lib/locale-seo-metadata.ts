import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { getPublicSiteUrl } from "@/lib/public-site-url";

const OG_LOCALE: Record<string, string> = {
  de: "de_DE",
  en: "en_US",
  tr: "tr_TR",
  fr: "fr_FR",
  es: "es_ES",
  ar: "ar_SA",
  ru: "ru_RU",
  pl: "pl_PL",
  ro: "ro_RO",
  ku: "ku_TR",
  it: "it_IT",
  uk: "uk_UA",
};

function isLocale(s: string): s is Locale {
  return (locales as readonly string[]).includes(s);
}

export type LocaleSeoContent = {
  title: string;
  description: string;
  keywords?: string | string[];
  ogType?: "website" | "article";
  /** Single image URL for Open Graph */
  ogImage?: string;
  publishedTime?: string;
  robots?: Metadata["robots"];
};

/**
 * Per-route canonical, hreflang, and Open Graph URL (fixes layout-level metadata
 * that previously pointed every locale page to `/{locale}` only).
 */
export function localeAlternatesAndSocial(
  locale: string,
  /** Path after the locale segment, e.g. `/privacy`, `/order`, or `""` for home */
  pathnameAfterLocale: string,
  opts: LocaleSeoContent,
): Metadata {
  const site = getPublicSiteUrl();

  if (!isLocale(locale)) {
    return {
      title: opts.title,
      description: opts.description,
      keywords: opts.keywords,
      robots: opts.robots,
    };
  }

  const raw = pathnameAfterLocale.startsWith("/")
    ? pathnameAfterLocale
    : pathnameAfterLocale
      ? `/${pathnameAfterLocale}`
      : "";
  const normalizedSuffix = raw === "/" ? "" : raw.replace(/\/$/, "") || "";

  const path = `/${locale}${normalizedSuffix}`;

  const languages: Record<string, string> = {
    "x-default": `${site}/${defaultLocale}${normalizedSuffix}`,
  };
  for (const l of locales) {
    languages[l] = `${site}/${l}${normalizedSuffix}`;
  }

  const openGraph: NonNullable<Metadata["openGraph"]> = {
    type: opts.ogType ?? "website",
    locale: OG_LOCALE[locale] ?? locale,
    url: `${site}${path}`,
    siteName: "TransPool24",
    title: opts.title,
    description: opts.description,
    ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
    ...(opts.ogImage ? { images: [{ url: opts.ogImage }] } : {}),
  };

  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    robots: opts.robots,
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
    },
    alternates: {
      canonical: `${site}${path}`,
      languages,
    },
  };
}
