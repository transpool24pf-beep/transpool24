import { redirect } from "next/navigation";

/** Former customer parcel form; hiring for city parcels lives on /driver. */
export default async function ParcelDeliveryRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/driver`);
}
