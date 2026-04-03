import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CookieConsentBarrier } from "@/components/CookieConsentBarrier";
import { LocaleDocumentLang } from "@/components/LocaleDocumentLang";
import { routing, type Locale } from "@/i18n/routing";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
      <LocaleDocumentLang locale={locale} />
      <CookieConsentBarrier />
      {children}
    </NextIntlClientProvider>
  );
}
