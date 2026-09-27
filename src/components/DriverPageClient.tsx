"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { shouldOpenDriverFormFromDraft } from "@/lib/driver-wizard-storage";
import { DriverWizardForm } from "./DriverWizardForm";
import { OrderRouteLottie } from "./OrderRouteLottie";
import { TRANSPOOL24_VAN_IMAGE } from "@/lib/brand-assets";
import { PageAdsLayout } from "@/components/ads/PageAdsLayout";

export function DriverPageClient({ locale }: { locale: string }) {
  const t = useTranslations("driver.landing");
  const [showForm, setShowForm] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const rtl = locale === "ar";

  useEffect(() => {
    if (shouldOpenDriverFormFromDraft()) setShowForm(true);
  }, []);

  const faqItems = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((i) => ({
        q: t(`faq${i}q` as "faq1q"),
        a: t(`faq${i}a` as "faq1a"),
      })),
    [t],
  );

  const scrollToApply = () => {
    setShowForm(true);
    setTimeout(() => document.getElementById("driver-form")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const applyBtn = (
    <span className="inline-flex items-center gap-2">
      <span className={rtl ? "rotate-180" : ""} aria-hidden>
        →
      </span>
      {t("heroCta")}
    </span>
  );

  return (
    <main className="bg-[#f6f7fb]" lang={locale} dir={rtl ? "rtl" : "ltr"}>
      <PageAdsLayout placement="banners">
      {!showForm ? (
        <>
          <section className="overflow-hidden bg-[#f6f4ef]">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
              <div className="max-w-xl">
                <h1 className="text-4xl font-bold leading-tight text-[var(--accent)] sm:text-5xl">
                  {t("heroTitle")}
                </h1>
                <p className="mt-5 text-lg leading-8 text-[#0d2137]">{t("heroLead")}</p>
                <div className="mt-6 flex max-w-xl flex-col gap-4 rounded-2xl border border-[#0d2137]/12 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                  <div className="flex shrink-0 justify-center sm:justify-start">
                    <OrderRouteLottie size="lg" className="[&_p]:hidden" />
                  </div>
                  <div className="min-w-0 text-center sm:text-start">
                    <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
                      {t("trackingTeaserEyebrow")}
                    </p>
                    <p className="mt-1 text-base font-semibold text-[#0d2137]">{t("trackingTeaserTitle")}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#0d2137]/75">{t("trackingTeaserBody")}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={scrollToApply}
                  className="mt-8 rounded-xl bg-[var(--accent)] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:opacity-90"
                >
                  {t("heroCta")}
                </button>
                <p className="mt-4 text-sm text-[#0d2137]/70">{t("heroFootnote")}</p>
              </div>
              <div className="relative">
                <div className="overflow-hidden rounded-[2rem] bg-[#e8ecf0] p-4 shadow-2xl ring-1 ring-[#0d2137]/10 sm:p-6">
                  <Image
                    src={TRANSPOOL24_VAN_IMAGE}
                    alt={t("vanAlt")}
                    width={1024}
                    height={620}
                    className="h-auto w-full object-contain"
                    priority
                    sizes="(max-width: 1024px) 92vw, 560px"
                    style={{ filter: "drop-shadow(0 16px 28px rgba(13,33,55,0.16))" }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-[#e3f2fd] p-6">
                <div className="mb-3 text-3xl">💻</div>
                <h2 className="text-lg font-semibold text-[#0d2137]">{t("card1Title")}</h2>
                <p className="mt-2 text-sm text-[#0d2137]/80">{t("card1Body")}</p>
              </div>
              <div className="rounded-2xl bg-[#fff8e1] p-6">
                <div className="mb-3 text-3xl">🪪</div>
                <h2 className="text-lg font-semibold text-[#0d2137]">{t("card2Title")}</h2>
                <p className="mt-2 text-sm text-[#0d2137]/80">{t("card2Body")}</p>
              </div>
              <div className="rounded-2xl bg-[#fce4ec] p-6">
                <div className="mb-3 text-3xl">👥</div>
                <h2 className="text-lg font-semibold text-[#0d2137]">{t("card3Title")}</h2>
                <p className="mt-2 text-sm text-[#0d2137]/80">{t("card3Body")}</p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-[#0d2137]">{t("workTypesTitle")}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[#0d2137]/75">
              {t("workTypesLead")}
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
                <div className="mb-3 text-3xl">📦</div>
                <h3 className="text-lg font-semibold text-[#0d2137]">{t("workTypeParcelsTitle")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#0d2137]/80">{t("workTypeParcelsBody")}</p>
              </div>
              <div className="rounded-2xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
                <div className="mb-3 text-3xl">🚚</div>
                <h3 className="text-lg font-semibold text-[#0d2137]">{t("workTypeB2bTitle")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#0d2137]/80">{t("workTypeB2bBody")}</p>
              </div>
            </div>
            <p className="mt-6 text-center text-sm font-medium text-[#0d2137]/70">{t("workTypesFormHint")}</p>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={scrollToApply}
                className="rounded-xl bg-[var(--accent)] px-8 py-3 font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                {t("heroCta")}
              </button>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-[#0d2137]">{t("requirementsTitle")}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="text-2xl">🛵</div>
                <h3 className="mt-2 font-semibold text-[#0d2137]">{t("req1Title")}</h3>
                <p className="mt-1 text-sm text-[#0d2137]/70">{t("req1Body")}</p>
              </div>
              <div>
                <div className="text-2xl">⏱</div>
                <h3 className="mt-2 font-semibold text-[#0d2137]">{t("req2Title")}</h3>
                <p className="mt-1 text-sm text-[#0d2137]/70">{t("req2Body")}</p>
              </div>
              <div>
                <div className="text-2xl">🎉</div>
                <h3 className="mt-2 font-semibold text-[#0d2137]">{t("req3Title")}</h3>
                <p className="mt-1 text-sm text-[#0d2137]/70">{t("req3Body")}</p>
              </div>
              <div>
                <div className="text-2xl">📦</div>
                <h3 className="mt-2 font-semibold text-[#0d2137]">{t("req4Title")}</h3>
                <p className="mt-1 text-sm text-[#0d2137]/70">{t("req4Body")}</p>
              </div>
            </div>
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={scrollToApply}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                {applyBtn}
              </button>
            </div>
          </section>

          <section className="bg-white py-14">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="text-center text-3xl font-bold text-[var(--accent)]">{t("processTitle")}</h2>
              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e3f2fd] text-3xl">
                    📱
                  </div>
                  <p className="mt-4 text-sm font-medium text-[#0d2137]">{t("process1")}</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff8e1] text-3xl">
                    📄
                  </div>
                  <p className="mt-4 text-sm font-medium text-[#0d2137]">{t("process2")}</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fce4ec] text-3xl">
                    🛞
                  </div>
                  <p className="mt-4 text-sm font-medium text-[#0d2137]">{t("process3")}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-[#0d2137]">{t("testimonialTitle")}</h2>
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[#0d2137]/10 bg-white p-8 shadow-sm">
              <p className="text-lg text-[#0d2137]/90">{t("testimonialQuote")}</p>
              <p className="mt-4 font-semibold text-[#0d2137]">{t("testimonialAuthor")}</p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span className="h-2 w-2 rounded-full bg-[#0d2137]/20" />
              <span className="h-2 w-2 rounded-full bg-[#0d2137]/20" />
            </div>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={scrollToApply}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                {applyBtn}
              </button>
            </div>
          </section>

          <section className="bg-white py-14">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
              <h2 className="text-center text-2xl font-bold text-[#0d2137]">{t("faqTitle")}</h2>
              <div className="mt-8 space-y-2">
                {faqItems.map((item, i) => (
                  <div key={i} className="rounded-xl border border-[#0d2137]/10 bg-[#f8f9fa]">
                    <button
                      type="button"
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start font-medium text-[#0d2137]"
                    >
                      {item.q}
                      <span className="shrink-0 text-xl text-[var(--accent)]">{faqOpen === i ? "−" : "+"}</span>
                    </button>
                    {faqOpen === i && (
                      <div className="border-t border-[#0d2137]/10 px-5 py-4 text-sm text-[#0d2137]/80">{item.a}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={scrollToApply}
                  className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 font-semibold text-white shadow-lg transition hover:opacity-90"
                >
                  {applyBtn}
                </button>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section
          id="driver-form"
          className="relative overflow-hidden bg-gradient-to-br from-[#f4f9ff] via-white to-[#fff7f1] px-1 py-6 sm:px-2 sm:py-10 lg:py-14"
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.4]" aria-hidden>
            <div className="absolute start-0 top-0 h-96 w-96 rounded-full bg-sky-100 blur-3xl" />
            <div className="absolute end-10 bottom-10 h-72 w-72 rounded-full bg-[#e85d04]/10 blur-3xl" />
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14" dir="ltr">
            <div dir={rtl ? "rtl" : "ltr"}>
              <h1 className="text-[2.15rem] font-extrabold leading-[1.18] tracking-tight text-[#152033] sm:text-5xl lg:text-[3.15rem]">
                <span className="text-[var(--accent)]">{t("partnerTitleAccent")}</span>
                <span> {t("partnerTitleRest")}</span>
              </h1>
              <div className="mt-7 space-y-5 rounded-2xl bg-[#d4ebff] px-6 py-7 text-[1.05rem] leading-9 text-[#1b2c44] sm:px-8 sm:py-8 sm:text-[1.125rem] sm:leading-10">
                <p>
                  {t.rich("partnerBody1", {
                    brand: (chunks) => <strong className="font-bold">{chunks}</strong>,
                  })}
                </p>
                <p>
                  {t.rich("partnerBody2", {
                    brand: (chunks) => <strong className="font-bold">{chunks}</strong>,
                  })}
                </p>
              </div>
              <div className="mt-10 flex justify-center lg:justify-start">
                <Image
                  src={TRANSPOOL24_VAN_IMAGE}
                  alt={t("vanAlt")}
                  width={720}
                  height={430}
                  className="h-auto w-full max-w-xl object-contain drop-shadow-2xl"
                />
              </div>
            </div>
            <div dir={rtl ? "rtl" : "ltr"}>
              <div className="rounded-2xl border border-[#0d2137]/8 bg-white p-5 shadow-[0_24px_60px_-28px_rgba(13,33,55,0.28)] sm:p-8">
                <DriverWizardForm onBack={() => setShowForm(false)} initialCity="" />
              </div>
            </div>
          </div>
        </section>
      )}
      </PageAdsLayout>
    </main>
  );
}
