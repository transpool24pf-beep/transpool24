"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const SECTION_IDS = [
  "scope",
  "controller",
  "processing",
  "legal",
  "retention",
  "rights",
  "changes",
] as const;

type Props = { locale: string };

export function PrivacyPolicyView({ locale }: Props) {
  const t = useTranslations("privacyPolicy");
  const rtl = locale === "ar";

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
            <PrivacySection id="scope" titleKey="s1.title" bodyKeys={["s1.p1", "s1.p2", "s1.p3"]} t={t as (key: string) => string} />
            <PrivacySection id="controller" titleKey="s2.title" bodyKeys={["s2.p1", "s2.p2"]} t={t as (key: string) => string} />

            <section id="processing" className="scroll-mt-28">
              <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">{t("s3.title")}</h2>
              <p className="mt-4 leading-relaxed">{t("s3.intro")}</p>
              <div className="mt-6 overflow-x-auto rounded-xl border border-[#0d2137]/10 bg-[#f4f6f8]">
                <table className="w-full min-w-[520px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#0d2137]/10 bg-white text-start">
                      <th className="px-4 py-3 font-bold text-[var(--primary)]">{t("s3.colData")}</th>
                      <th className="px-4 py-3 font-bold text-[var(--primary)]">{t("s3.colPurpose")}</th>
                      <th className="px-4 py-3 font-bold text-[var(--primary)]">{t("s3.colLegal")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((r) => (
                      <tr key={r} className="border-b border-[#0d2137]/8 align-top last:border-0">
                        <td className="px-4 py-3">{t(`s3.r${r}.data`)}</td>
                        <td className="px-4 py-3">{t(`s3.r${r}.purpose`)}</td>
                        <td className="px-4 py-3">{t(`s3.r${r}.legal`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-6 leading-relaxed">{t("s3.outro")}</p>
            </section>

            <PrivacySection id="legal" titleKey="s4.title" bodyKeys={["s4.p1", "s4.p2", "s4.p3"]} t={t as (key: string) => string} />
            <PrivacySection id="retention" titleKey="s5.title" bodyKeys={["s5.p1", "s5.p2", "s5.p3"]} t={t as (key: string) => string} />

            <section id="rights" className="scroll-mt-28">
              <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">{t("s6.title")}</h2>
              <p className="mt-4 leading-relaxed">{t("s6.intro")}</p>
              <ul className="mt-6 space-y-3">
                {["a", "b", "c", "d", "e", "f"].map((k) => (
                  <li
                    key={k}
                    className="flex gap-3 text-sm leading-relaxed sm:text-base before:mt-2 before:h-2 before:w-2 before:shrink-0 before:rounded-sm before:bg-[var(--accent)] before:content-['']"
                  >
                    <span>{t(`s6.${k}`)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 leading-relaxed">{t("s6.outro")}</p>
            </section>

            <PrivacySection id="changes" titleKey="s7.title" bodyKeys={["s7.p1", "s7.p2"]} t={t as (key: string) => string} />

            <section className="rounded-2xl border border-[#0d2137]/10 bg-[#fafbfc] p-6 sm:p-8">
              <h2 className="text-lg font-bold text-[var(--primary)]">{t("socialTitle")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/75">{t("socialIntro")}</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <span className="font-semibold text-[var(--primary)]">Instagram</span> —{" "}
                  <a
                    href="https://privacycenter.instagram.com/policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] underline hover:opacity-90"
                  >
                    Meta
                  </a>
                </li>
                <li>
                  <span className="font-semibold text-[var(--primary)]">TikTok</span> —{" "}
                  <a
                    href="https://www.tiktok.com/legal/page/eea/privacy-policy/de"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] underline hover:opacity-90"
                  >
                    TikTok Privacy
                  </a>
                </li>
                <li>
                  <span className="font-semibold text-[var(--primary)]">LinkedIn</span> —{" "}
                  <a
                    href="https://legal.linkedin.com/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] underline hover:opacity-90"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <span className="font-semibold text-[var(--primary)]">Facebook</span> —{" "}
                  <a
                    href="https://www.facebook.com/privacy/policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] underline hover:opacity-90"
                  >
                    Meta
                  </a>
                </li>
                <li>
                  <span className="font-semibold text-[var(--primary)]">YouTube</span> —{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] underline hover:opacity-90"
                  >
                    Google
                  </a>
                </li>
              </ul>
            </section>
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/50">
                {t("tocTitle")}
              </p>
              <ol className="mt-4 list-decimal space-y-2 ps-5 text-sm">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="text-[var(--foreground)]/80 hover:text-[var(--accent)] hover:underline">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-6 rounded-2xl border border-[var(--accent)]/25 bg-gradient-to-br from-white to-[#fff8f4] p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/50">{t("contactTitle")}</p>
              <Link
                href={`/${locale}/support`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-95"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {t("contactCta")}
              </Link>
              <p className="mt-4 text-xs text-[var(--foreground)]/55">{t("contactEmailLabel")}</p>
              <a href={`mailto:${t("privacyEmail")}`} className="mt-1 block text-sm font-semibold text-[var(--accent)] hover:underline">
                {t("privacyEmail")}
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function PrivacySection({
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
