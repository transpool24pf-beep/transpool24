import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DriverPageClient } from "@/components/DriverPageClient";

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
