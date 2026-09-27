import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ParcelDeliveryForm } from "@/components/ParcelDeliveryForm";
import { localeAlternatesAndSocial } from "@/lib/locale-seo-metadata";

const labels: Record<string, { title: string; description: string }> = {
  ar: { title: "توصيل الطرود محليًا | TransPool24", description: "احجز استلامًا وتسليمًا مباشرًا للطرود في بفورتسهايم والمنطقة." },
  de: { title: "Lokale Paketzustellung | TransPool24", description: "Direkte Paketabholung und Zustellung in Pforzheim und Umgebung buchen." },
  en: { title: "Local Parcel Delivery | TransPool24", description: "Book direct parcel pickup and delivery in Pforzheim and nearby areas." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const copy = labels[locale] ?? labels.en;
  return localeAlternatesAndSocial(locale, "/parcel-delivery", copy);
}

export default async function ParcelDeliveryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = labels[locale] ?? labels.en;
  const content: Record<string, { heading: string; detail: string }> = {
    ar: { heading: "توصيل مباشر من الباب إلى الباب", detail: "أدخل بيانات المرسل والمستلم ومقاس الطرد لتحصل على تقدير للسعر قبل تأكيد الحجز." },
    de: { heading: "Direkt von Tür zu Tür", detail: "Geben Sie Absender, Empfänger und Paketmaße ein. Sie sehen eine Preisschätzung, bevor Sie den Auftrag bestätigen." },
    en: { heading: "Direct door-to-door delivery", detail: "Enter sender, recipient and parcel details to see an estimate before confirming your booking." },
  };
  const text = content[locale] ?? content.en;
  return <>
    <Header />
    <main className="min-h-[calc(100vh-8rem)] bg-[var(--background)] px-4 py-10 sm:py-14" lang={locale}>
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#e85d04]">TransPool24</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0d2137] sm:text-4xl">{copy.title.replace(" | TransPool24", "")}</h1>
        <h2 className="mt-3 text-xl font-semibold text-[#0d2137]">{text.heading}</h2>
        <p className="mb-6 mt-2 max-w-2xl text-sm leading-relaxed text-[#0d2137]/70">{text.detail}</p>
        <ParcelDeliveryForm locale={locale} />
      </div>
    </main>
    <Footer />
  </>;
}
