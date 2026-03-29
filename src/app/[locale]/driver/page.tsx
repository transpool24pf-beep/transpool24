import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DriverPageClient } from "@/components/DriverPageClient";
import { localeAlternatesAndSocial } from "@/lib/locale-seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "driver.landing" });
  return localeAlternatesAndSocial(locale, "/driver", {
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function DriverApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <Header />
      <DriverPageClient locale={locale} />
      <Footer />
    </>
  );
}
