import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { localeAlternatesAndSocial } from "@/lib/locale-seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("order");
  return localeAlternatesAndSocial(locale, "/order/success", {
    title: t("success"),
    description: t("success"),
    robots: { index: false, follow: false },
  });
}

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  const { session_id } = await searchParams;
  const t = await getTranslations("order");

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-8rem)] bg-[var(--background)] py-16">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="rounded-xl border border-green-200 bg-green-50 p-8">
            <h1 className="text-xl font-bold text-green-800">
              {t("success")}
            </h1>
            {session_id && (
              <p className="mt-2 text-sm text-green-700">
                Session: {session_id.slice(0, 20)}…
              </p>
            )}
            <Link
              href={`/${locale}`}
              className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-2 font-medium text-white hover:opacity-90"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
