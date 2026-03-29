"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const SECTION_IDS = [
  "scope",
  "contract",
  "booking",
  "payment",
  "conduct",
  "liability",
  "final",
] as const;

type Props = { locale: string };

export function TermsOfUseView({ locale }: Props) {
  const t = useTranslations("termsOfUse");
  const rtl = locale === "ar" || locale === "ku";

  const toc = SECTION_IDS.map((id) => ({ id, label: t(`toc.${id}`) }));

  return (
    <div className="min-h-screen bg-white" dir={rtl ? "rtl" : "ltr"}>
      <div className="border-b border-[#0d2137]/10 bg-[#fafbfc]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <nav className="text-sm text-[var(--foreground)]/60">
            <Link href={`/${locale}`} className="hover:text-[var(--accent)] hover:underline">
              {t("breadcrumbHome")}
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-[var(--foreground)]/80">{t("breadcrumbCurrent")}</span>
          </nav>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--primary)] sm:text-4xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-[var(--foreground)]/75">{t("pageLead")}</p>
          <p className="mt-2 text-sm font-medium text-[var(--accent)]">{t("updated")}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-14">
          <article className="min-w-0 space-y-12 text-[var(--foreground)]/85">
            <TermsSection id="scope" titleKey="s1.title" bodyKeys={["s1.p1", "s1.p2", "s1.p3"]} t={t as (key: string) => string} />
            <TermsSection id="contract" titleKey="s2.title" bodyKeys={["s2.p1", "s2.p2"]} t={t as (key: string) => string} />
            <TermsSection id="booking" titleKey="s3.title" bodyKeys={["s3.p1", "s3.p2", "s3.p3"]} t={t as (key: string) => string} />
            <TermsSection id="payment" titleKey="s4.title" bodyKeys={["s4.p1", "s4.p2"]} t={t as (key: string) => string} />
            <TermsSection id="conduct" titleKey="s5.title" bodyKeys={["s5.p1", "s5.p2"]} t={t as (key: string) => string} />
            <TermsSection id="liability" titleKey="s6.title" bodyKeys={["s6.p1", "s6.p2", "s6.p3"]} t={t as (key: string) => string} />
            <TermsSection id="final" titleKey="s7.title" bodyKeys={["s7.p1", "s7.p2", "s7.p3"]} t={t as (key: string) => string} />

            <section className="rounded-2xl border border-[#0d2137]/10 bg-[#fafbfc] p-6 sm:p-8">
              <h2 className="text-lg font-bold text-[var(--primary)]">{t("relatedTitle")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/75">{t("relatedBody")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/privacy`}
                  className="inline-flex rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  {t("relatedPrivacy")}
                </Link>
                <Link
                  href={`/${locale}/support`}
                  className="inline-flex rounded-lg border-2 border-[#0d2137]/20 px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[#0d2137]/5"
                >
                  {t("relatedContact")}
                </Link>
              </div>
            </section>
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-[#0d2137]/10 bg-[#fafbfc] p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]/70">{t("tocTitle")}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="text-[var(--foreground)]/80 hover:text-[var(--accent)] hover:underline">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function TermsSection({
  id,
  titleKey,
  bodyKeys,
  t,
}: {
  id: string;
  titleKey: string;
  bodyKeys: string[];
  t: (key: string) => string;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">{t(titleKey)}</h2>
      <div className="mt-4 space-y-4 leading-relaxed">
        {bodyKeys.map((k) => (
          <p key={k}>{t(k)}</p>
        ))}
      </div>
    </section>
  );
}
