import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-8rem)]">
        <section className="relative overflow-hidden bg-[#0d2137] text-white">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="/images/van1.png"
              alt=""
              fill
              className="object-cover object-center"
              priority
            />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                {t("title")}
              </h1>
              <p className="mt-4 text-lg text-white/90">
                {t("subtitle")}
              </p>
              <Link
                href={`/${locale}/order`}
                className="mt-8 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 text-lg font-semibold text-white transition hover:opacity-90"
              >
                {t("cta")}
              </Link>
              <Link
                href={`/${locale}/driver`}
                className="ml-3 mt-8 inline-block rounded-lg border border-white/25 bg-white/10 px-6 py-3 text-lg font-semibold text-white transition hover:bg-white/15"
              >
                {t("applyAsDriver")}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-[var(--primary)]">
            {t("features.title")}
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--primary)]">
                {t("features.speed")}
              </h3>
              <p className="mt-2 text-[var(--foreground)]/80">
                {t("features.speedDesc")}
              </p>
            </div>
            <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--primary)]">
                {t("features.trust")}
              </h3>
              <p className="mt-2 text-[var(--foreground)]/80">
                {t("features.trustDesc")}
              </p>
            </div>
            <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--primary)]">
                {t("features.local")}
              </h3>
              <p className="mt-2 text-[var(--foreground)]/80">
                {t("features.localDesc")}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#0d2137]/5 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-[#0d2137]/10 bg-white p-8 text-center shadow-sm md:flex-row md:text-left">
              <Image
                src="/images/van2.png"
                alt="TransPool24"
                width={280}
                height={160}
                className="rounded-lg object-cover"
              />
              <div>
                <h3 className="text-xl font-bold text-[var(--primary)]">
                  TransPool24 – {t("features.local")}
                </h3>
                <p className="mt-2 text-[var(--foreground)]/80">
                  {t("features.localDesc")}
                </p>
                <Link
                  href={`/${locale}/order`}
                  className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 font-medium text-white transition hover:opacity-90"
                >
                  {t("cta")}
                </Link>
                <Link
                  href={`/${locale}/driver`}
                  className="ml-3 mt-4 inline-block rounded-lg border border-[#0d2137]/15 bg-white px-5 py-2.5 font-medium text-[#0d2137] transition hover:bg-[#0d2137]/5"
                >
                  {t("driverSignup")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
