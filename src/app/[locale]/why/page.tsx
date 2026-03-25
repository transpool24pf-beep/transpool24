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
  const title =
    locale === "ar" ? "من نحن | TransPool24 — رؤية رقمية من بفورتسهايم" : data.metaTitle;
  const description =
    locale === "ar"
      ? "رؤية هندسية، لوجستيات مرنة، Minimalist Modern، وأهداف استراتيجية من ألمانيا — ثم تفاصيل التشغيل للشركات."
      : data.heroSub.slice(0, 155);
  return { title, description };
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
        <WhyTranspool24Content
          data={data}
          locale={locale}
          arAboutNarrativeFirst={locale === "ar"}
        />
      </main>
      <Footer />
    </>
  );
}
