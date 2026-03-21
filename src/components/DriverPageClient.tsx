"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { DriverWizardForm } from "./DriverWizardForm";

const HERO_IMAGE = "/images/5677.png";

export function DriverPageClient({ locale }: { locale: string }) {
  const t = useTranslations("driver.landing");
  const [showForm, setShowForm] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const rtl = locale === "ar";

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
      {!showForm ? (
        <>
          <section className="overflow-hidden bg-[#f6f4ef]">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
              <div className="max-w-xl">
                <h1 className="text-4xl font-bold leading-tight text-[var(--accent)] sm:text-5xl">
                  {t("heroTitle")}
                </h1>
                <p className="mt-5 text-lg leading-8 text-[#0d2137]">{t("heroLead")}</p>
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
                <div className="overflow-hidden rounded-[2rem] bg-[#ff8a00] p-4 shadow-2xl">
                  <Image
                    src={HERO_IMAGE}
                    alt={t("vanAlt")}
                    width={900}
                    height={620}
                    className="h-[360px] w-full rounded-[1.5rem] object-cover"
                    priority
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
        <section id="driver-form" className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-[#0d2137]/10 bg-white p-6 shadow-lg sm:p-8">
            <DriverWizardForm onBack={() => setShowForm(false)} initialCity="" />
          </div>
        </section>
      )}
    </main>
  );
}
