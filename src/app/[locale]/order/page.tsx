import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OrderPageClient } from "@/components/OrderPageClient";
import { localeAlternatesAndSocial } from "@/lib/locale-seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("order");
  return localeAlternatesAndSocial(locale, "/order", {
    title: t("title"),
    description: `${t("title")} — ${t("step1")}`,
  });
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("order");

  return <OrderPageClient locale={locale} title={t("title")} />;
}
