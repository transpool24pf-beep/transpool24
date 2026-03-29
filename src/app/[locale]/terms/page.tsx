import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TermsOfUseView } from "@/components/terms/TermsOfUseView";
import { localeAlternatesAndSocial } from "@/lib/locale-seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "termsOfUse" });
  return localeAlternatesAndSocial(locale, "/terms", {
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <>
      <Header />
      <TermsOfUseView locale={locale} />
      <Footer />
    </>
  );
}
