import { getTranslations } from "next-intl/server";
import { OrderPageClient } from "@/components/OrderPageClient";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("order");

  return <OrderPageClient locale={locale} title={t("title")} />;
}
