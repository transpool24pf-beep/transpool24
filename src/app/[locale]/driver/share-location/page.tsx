import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DriverShareLocationClient } from "@/components/DriverShareLocationClient";

export default async function DriverShareLocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ job_id?: string; token?: string }>;
}) {
  const { locale } = await params;
  const { job_id: jobId, token } = await searchParams;
  const t = await getTranslations("driverShare");

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-8rem)] bg-[var(--background)] py-8">
        <div className="mx-auto max-w-lg px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-[var(--primary)] sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">{t("pageSubtitle")}</p>
          <div className="mt-8">
            <DriverShareLocationClient jobId={jobId ?? null} token={token ?? null} locale={locale} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
