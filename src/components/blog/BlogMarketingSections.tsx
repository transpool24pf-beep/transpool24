import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BlogFaqClient, type BlogFaqItem } from "@/components/blog/BlogFaqClient";
import type { Locale } from "@/i18n/routing";

const STATS_IMG =
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&q=80&auto=format&fit=crop";
const TOUCH_IMG =
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=80&auto=format&fit=crop";
/** Blog index — closing visual above dark footer (`assets/7654.png` → public). */
const BLOG_FOOTER_MODEL = "/images/7654.png";

function StarRow() {
  return (
    <div className="mb-4 flex gap-0.5 text-[var(--accent)]" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-base">
          ★
        </span>
      ))}
    </div>
  );
}

function ProgressBar({ label, pct }: { label: string; pct: string }) {
  const n = Math.min(100, Math.max(0, parseInt(pct, 10) || 0));
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold text-[#1a1a1a]">
        <span>{label}</span>
        <span className="text-[var(--accent)]">{pct}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/[0.08]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700"
          style={{ width: `${n}%` }}
        />
      </div>
    </div>
  );
}

export async function BlogTemplateBeforePosts({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "blog" });

  return (
    <>
      {/* Partners */}
      <section className="border-y border-black/[0.06] bg-[#fafafa] px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6b6b6b]">
            {t("template.partnersHeadline")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16">
            {[t("template.partnerA"), t("template.partnerB"), t("template.partnerC"), t("template.partnerD"), t("template.partnerE")].map(
              (name) => (
                <span
                  key={name}
                  className="text-lg font-extrabold tracking-tight text-[#1a1a1a]/25 grayscale sm:text-xl"
                >
                  {name}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Services — 3 cards */}
      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            {t("template.servicesEyebrow")}
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-center text-3xl font-extrabold leading-[1.15] tracking-tight text-[#1a1a1a] sm:text-4xl">
            {t.rich("template.servicesTitleRich", {
              accent: (chunks) => <span className="text-[var(--accent)]">{chunks}</span>,
            })}
          </h2>
          <ul className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
            <li className="flex flex-col rounded-2xl bg-[var(--accent)] p-8 text-white shadow-[0_24px_50px_-20px_rgba(232,93,4,0.55)] ring-1 ring-black/5">
              <span className="text-3xl" aria-hidden>
                🚛
              </span>
              <h3 className="mt-6 text-xl font-extrabold">{t("template.svcRoadTitle")}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-white/90">{t("template.svcRoadDesc")}</p>
              <Link
                href={`/${locale}/order`}
                className="mt-8 inline-flex text-xs font-bold uppercase tracking-wider text-white underline-offset-4 hover:underline"
              >
                {t("template.svcReadMore")}
              </Link>
            </li>
            <li className="flex flex-col rounded-2xl border-2 border-[var(--accent)]/35 bg-white p-8 shadow-sm">
              <span className="text-3xl text-[var(--accent)]" aria-hidden>
                🚚
              </span>
              <h3 className="mt-6 text-xl font-extrabold text-[#1a1a1a]">{t("template.svcLand2Title")}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#6b6b6b]">{t("template.svcLand2Desc")}</p>
              <Link
                href={`/${locale}/order`}
                className="mt-8 inline-flex text-xs font-bold uppercase tracking-wider text-[var(--accent)] underline-offset-4 hover:underline"
              >
                {t("template.svcReadMore")}
              </Link>
            </li>
            <li className="flex flex-col rounded-2xl border-2 border-[var(--accent)]/35 bg-white p-8 shadow-sm">
              <span className="text-3xl text-[var(--accent)]" aria-hidden>
                📦
              </span>
              <h3 className="mt-6 text-xl font-extrabold text-[#1a1a1a]">{t("template.svcLand3Title")}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#6b6b6b]">{t("template.svcLand3Desc")}</p>
              <Link
                href={`/${locale}/order`}
                className="mt-8 inline-flex text-xs font-bold uppercase tracking-wider text-[var(--accent)] underline-offset-4 hover:underline"
              >
                {t("template.svcReadMore")}
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* Stats + image */}
      <section className="bg-[#f5f6f8] px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{t("template.statsEyebrow")}</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight text-[#1a1a1a] sm:text-4xl">
              {t.rich("template.statsTitleRich", {
                accent: (chunks) => <span className="text-[var(--accent)]">{chunks}</span>,
              })}
            </h2>
            <div className="mt-10 space-y-8">
              <ProgressBar label={t("template.statsLand1")} pct={t("template.statsLand1Pct")} />
              <ProgressBar label={t("template.statsLand2")} pct={t("template.statsLand2Pct")} />
              <ProgressBar label={t("template.statsLand3")} pct={t("template.statsLand3Pct")} />
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_28px_60px_-24px_rgba(0,0,0,0.35)] ring-1 ring-black/10">
              <Image
                src={STATS_IMG}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 480px"
                unoptimized
              />
              <div className="absolute bottom-6 start-6 rounded-xl bg-[var(--accent)] px-6 py-4 text-white shadow-lg">
                <p className="text-3xl font-extrabold tabular-nums">{t("template.statsBadge")}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-white/90">{t("template.statsBadgeSub")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            {t("template.testimonialsEyebrow")}
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-center text-3xl font-extrabold leading-[1.15] tracking-tight text-[#1a1a1a] sm:text-4xl">
            {t.rich("template.testimonialsTitleRich", {
              accent: (chunks) => <span className="text-[var(--accent)]">{chunks}</span>,
            })}
          </h2>
          <ul className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
            <li className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.18)]">
              <StarRow />
              <p className="flex-1 text-sm leading-relaxed text-[#4a4a4a]">&ldquo;{t("template.t1Quote")}&rdquo;</p>
              <div className="mt-8 flex items-center gap-3 border-t border-black/[0.06] pt-6">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--accent)]/15 ring-2 ring-[var(--accent)]/30" />
                <div>
                  <p className="text-sm font-bold text-[#1a1a1a]">{t("template.t1Name")}</p>
                  <p className="text-xs text-[#6b6b6b]">{t("template.t1Role")}</p>
                </div>
              </div>
            </li>
            <li className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.18)]">
              <StarRow />
              <p className="flex-1 text-sm leading-relaxed text-[#4a4a4a]">&ldquo;{t("template.t2Quote")}&rdquo;</p>
              <div className="mt-8 flex items-center gap-3 border-t border-black/[0.06] pt-6">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--accent)]/15 ring-2 ring-[var(--accent)]/30" />
                <div>
                  <p className="text-sm font-bold text-[#1a1a1a]">{t("template.t2Name")}</p>
                  <p className="text-xs text-[#6b6b6b]">{t("template.t2Role")}</p>
                </div>
              </div>
            </li>
            <li className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.18)]">
              <StarRow />
              <p className="flex-1 text-sm leading-relaxed text-[#4a4a4a]">&ldquo;{t("template.t3Quote")}&rdquo;</p>
              <div className="mt-8 flex items-center gap-3 border-t border-black/[0.06] pt-6">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--accent)]/15 ring-2 ring-[var(--accent)]/30" />
                <div>
                  <p className="text-sm font-bold text-[#1a1a1a]">{t("template.t3Name")}</p>
                  <p className="text-xs text-[#6b6b6b]">{t("template.t3Role")}</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Counters */}
      <section
        className="border-y border-black/[0.06] px-4 py-14 sm:px-6 sm:py-16"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <CounterCell icon="📦" value={t("template.counter1Val")} label={t("template.counter1Label")} />
          <CounterCell icon="👥" value={t("template.counter2Val")} label={t("template.counter2Label")} />
          <CounterCell icon="🌍" value={t("template.counter3Val")} label={t("template.counter3Label")} />
          <CounterCell icon="⏱" value={t("template.counter4Val")} label={t("template.counter4Label")} />
        </div>
      </section>
    </>
  );
}

function CounterCell({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <p className="mt-4 text-4xl font-extrabold tabular-nums text-[var(--accent)] sm:text-5xl">{value}</p>
      <p className="mt-2 text-sm font-bold uppercase tracking-wide text-[#1a1a1a]">{label}</p>
    </div>
  );
}

export async function BlogTemplateAfterPosts({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "blog" });

  const faqItems: BlogFaqItem[] = [
    { id: "1", q: t("template.faq1q"), a: t("template.faq1a") },
    { id: "2", q: t("template.faq2q"), a: t("template.faq2a") },
    { id: "3", q: t("template.faq3q"), a: t("template.faq3a") },
    { id: "4", q: t("template.faq4q"), a: t("template.faq4a") },
    { id: "5", q: t("template.faq5q"), a: t("template.faq5a") },
    { id: "6", q: t("template.faq6q"), a: t("template.faq6a") },
  ];

  const faqTitle = t.rich("template.faqTitleRich", {
    accent: (chunks) => <span className="text-[var(--accent)]">{chunks}</span>,
  });

  return (
    <>
      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-0 lg:overflow-hidden lg:rounded-2xl lg:shadow-[0_28px_60px_-28px_rgba(0,0,0,0.2)] lg:ring-1 lg:ring-black/10">
          <div className="relative min-h-[280px] overflow-hidden rounded-2xl lg:min-h-[420px] lg:rounded-none">
            <Image src={TOUCH_IMG} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" unoptimized />
            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl text-[var(--accent)] shadow-lg">
                ▶
              </span>
            </span>
          </div>
          <div className="flex flex-col justify-center bg-[var(--accent)] px-8 py-12 text-white lg:px-12 lg:py-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("template.touchTitle")}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/90">{t("template.touchLead")}</p>
            <ul className="mt-10 space-y-6 text-sm">
              <li className="flex gap-4">
                <span className="shrink-0 text-xl" aria-hidden>
                  📍
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/70">{t("template.touchAddressLabel")}</p>
                  <p className="mt-1 font-semibold">{t("template.touchAddress")}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="shrink-0 text-xl" aria-hidden>
                  ☎
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/70">{t("template.touchPhoneLabel")}</p>
                  <a href={`tel:${t("template.touchPhone").replace(/\s/g, "")}`} className="mt-1 block font-semibold hover:underline">
                    {t("template.touchPhone")}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="shrink-0 text-xl" aria-hidden>
                  ✉
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/70">{t("template.touchEmailLabel")}</p>
                  <a href={`mailto:${t("template.touchEmail")}`} className="mt-1 block font-semibold hover:underline">
                    {t("template.touchEmail")}
                  </a>
                </div>
              </li>
            </ul>
            <div className="mt-10 flex gap-4 text-2xl opacity-90" aria-hidden>
              <span>f</span>
              <span>𝕏</span>
              <span>in</span>
              <span>◎</span>
            </div>
          </div>
        </div>
      </section>

      <BlogFaqClient items={faqItems} title={faqTitle} />

      <section
        className="border-t border-black/[0.06] bg-white px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-10"
        aria-label={t("template.footerModelAria")}
      >
        <div className="mx-auto max-w-7xl">
          <Image
            src={BLOG_FOOTER_MODEL}
            alt={t("template.footerModelAlt")}
            width={800}
            height={480}
            className="h-auto w-full rounded-2xl object-contain shadow-[0_24px_60px_-32px_rgba(13,33,55,0.2)] ring-1 ring-[#0d2137]/10"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>
      </section>
    </>
  );
}
