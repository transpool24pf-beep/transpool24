import { getWhyPagePayload } from "@/lib/get-why-page-payload";
import { WhyTranspool24Content } from "@/components/why-transpool24/WhyTranspool24Content";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

/** Always read latest CMS/Supabase payload (not SSG snapshot). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const data = await getWhyPagePayload(locale);
  return {
    title: data.metaTitle,
    description: data.heroSub.slice(0, 155),
  };
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
        <WhyTranspool24Content data={data} locale={locale} />
      </main>
      <Footer />
    </>
  );
}
