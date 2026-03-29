import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SupportContactPage } from "@/components/support/SupportContactPage";
import { localeAlternatesAndSocial } from "@/lib/locale-seo-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "support" });
  return localeAlternatesAndSocial(locale, "/support", {
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  await params;
  return (
    <>
      <Header />
      <SupportContactPage />
      <Footer />
    </>
  );
}
