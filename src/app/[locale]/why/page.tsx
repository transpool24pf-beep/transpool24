import { getTranslations } from "next-intl/server";
import { getWhyPagePayload } from "@/lib/get-why-page-payload";
import { WhyTranspool24Content } from "@/components/why-transpool24/WhyTranspool24Content";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { localeAlternatesAndSocial } from "@/lib/locale-seo-metadata";

/** Always read latest CMS/Supabase payload (not SSG snapshot). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutNarrative" });
  return localeAlternatesAndSocial(locale, "/why", {
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function WhyTranspool24Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const data = await getWhyPagePayload(locale);

  return (
    <>
      <Header />
      <main>
        <WhyTranspool24Content data={data} locale={locale} aboutNarrativeFirst />
      </main>
      <Footer />
    </>
  );
}
