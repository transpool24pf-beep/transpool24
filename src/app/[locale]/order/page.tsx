import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderForm } from "@/components/OrderForm";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("order");

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-8rem)] bg-[var(--background)] py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-[var(--primary)] sm:text-3xl">
            {t("title")}
          </h1>
          <OrderForm locale={locale} />
        </div>
      </main>
      <Footer />
    </>
  );
}
