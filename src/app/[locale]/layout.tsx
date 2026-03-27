import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com").replace(/\/$/, "");

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

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "siteMetadata" });
  const rawKw = t.raw("keywords");
  const keywords = Array.isArray(rawKw)
    ? (rawKw as unknown[]).filter((k): k is string => typeof k === "string")
    : [];

  const title = t("title");
  const description = t("description");
  const path = `/${locale}`;

  const languages: Record<string, string> = {
    "x-default": `${SITE}/${defaultLocale}`,
  };
  for (const loc of routing.locales) {
    languages[loc] = `${SITE}/${loc}`;
  }

  return {
    title,
    description,
    keywords,
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale] ?? locale,
      url: `${SITE}${path}`,
      siteName: "TransPool24",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `${SITE}${path}`,
      languages,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
