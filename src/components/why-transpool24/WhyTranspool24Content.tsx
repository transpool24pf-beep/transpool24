import Image from "next/image";
import Link from "next/link";
import type { WhyPagePayload } from "@/lib/why-transpool24-types";
import { WhyTranspool24Icon } from "./WhyTranspool24Icon";

type Props = { data: WhyPagePayload; locale: string };

export function WhyTranspool24Content({ data, locale }: Props) {
  const rtl = locale === "ar";
  const faqMid = Math.ceil(data.faqs.length / 2);
  const faqCol1 = data.faqs.slice(0, faqMid);
  const faqCol2 = data.faqs.slice(faqMid);

  return (
    <div className="bg-[#f4f6f8] pb-20 pt-6 sm:pb-28 sm:pt-10" dir={rtl ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <article className="overflow-hidden rounded-[1.25rem] border border-[#0d2137]/8 bg-white shadow-sm sm:rounded-[1.75rem]">
          <div className="border-b border-[#0d2137]/6 bg-gradient-to-br from-[#f8fafc] to-white px-6 py-10 sm:px-10 sm:py-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">{data.heroBadge}</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-[var(--primary)] sm:text-4xl md:text-[2.35rem]">
              {data.headline}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--foreground)]/75">{data.heroSub}</p>
          </div>

          <div className="grid gap-10 px-6 py-10 sm:gap-12 sm:px-10 sm:py-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-8">
              <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">{data.introTitle}</h2>
              <p className="mt-4 leading-relaxed text-[var(--foreground)]/80">{data.introLead}</p>

              <h3 className="mt-10 text-lg font-bold text-[var(--primary)]">{data.h2_1}</h3>
              <p className="mt-3 leading-relaxed text-[var(--foreground)]/78">{data.p1}</p>

              <h3 className="mt-8 text-lg font-bold text-[var(--primary)]">{data.h2_2}</h3>
              <p className="mt-3 leading-relaxed text-[var(--foreground)]/78">{data.p2}</p>

              <h3 className="mt-8 text-lg font-bold text-[var(--primary)]">{data.h2_3}</h3>
              <p className="mt-3 leading-relaxed text-[var(--foreground)]/78">{data.p3}</p>
            </div>

            <aside className="lg:col-span-4">
              <div className="sticky top-24 rounded-2xl border border-[var(--accent)]/15 bg-gradient-to-b from-white to-[#fafbfc] p-6 shadow-md ring-1 ring-[#0d2137]/5">
                <h2 className="text-lg font-bold text-[var(--primary)]">{data.sidebarTitle}</h2>
                <ul className="mt-6 space-y-8">
                  {data.sidebar.map((item, i) => (
                    <li key={i} className="text-center sm:text-start">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] sm:mx-0">
                        <WhyTranspool24Icon id={item.icon} />
                      </div>
                      <p className="font-bold text-[var(--primary)]">{item.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/70">{item.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>

          <div className="border-t border-[#0d2137]/6 bg-[#fafbfc] px-6 py-10 sm:px-10 sm:py-12">
            <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">{data.tipsTitle}</h2>
            <p className="mt-3 max-w-3xl text-[var(--foreground)]/75">{data.tipsIntro}</p>
            <ol className="mt-8 space-y-6">
              {data.tips.map((tip, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--primary)]">{tip.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)]/75">{tip.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="px-6 py-10 sm:px-10 sm:py-12">
            <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">{data.servicesTitle}</h2>
            <p className="mt-3 max-w-3xl text-[var(--foreground)]/75">{data.servicesIntro}</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.serviceTypes.map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#0d2137]/10 bg-white p-6 shadow-sm transition hover:border-[var(--accent)]/25 hover:shadow-md"
                >
                  <div className="mb-3 text-[var(--accent)]">
                    <WhyTranspool24Icon id={i === 0 ? "package" : i === 1 ? "truck" : "shield"} />
                  </div>
                  <h3 className="font-bold text-[var(--primary)]">{s.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/72">{s.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#0d2137]/6 px-6 py-10 sm:px-10 sm:py-12">
            <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">{data.platformTitle}</h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-[var(--foreground)]/78">{data.platformBody}</p>
          </div>

          <div className="px-6 pb-10 sm:px-10 sm:pb-12">
            <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">{data.completingTitle}</h2>
            <p className="mt-4 leading-relaxed text-[var(--foreground)]/78">{data.completingP1}</p>
            <p className="mt-4 leading-relaxed text-[var(--foreground)]/78">{data.completingP2}</p>
            <p className="mt-4 leading-relaxed text-[var(--foreground)]/78">{data.completingP3}</p>
            <p className="mt-8 text-lg font-medium text-[var(--accent)]">{data.closingLine}</p>
          </div>

          <div className="px-6 pb-10 sm:px-10 sm:pb-12">
            <div className="relative aspect-[21/9] min-h-[200px] overflow-hidden rounded-2xl bg-[#0d2137]/5 shadow-inner sm:aspect-[2.4/1]">
              <Image
                src={data.heroImageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1152px) 100vw, 1152px"
                priority
                unoptimized={data.heroImageUrl.startsWith("http")}
              />
            </div>
          </div>

          <div className="border-t border-[#0d2137]/6 px-6 py-10 sm:px-10 sm:py-12">
            <h2 className="text-center text-2xl font-extrabold text-[var(--primary)] sm:text-3xl">{data.faqTitle}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-x-10 md:gap-y-4">
              <div className="space-y-3">
                {faqCol1.map((f, i) => (
                  <details
                    key={`a-${i}`}
                    className="group rounded-xl border border-[#0d2137]/10 bg-white px-4 py-3 shadow-sm open:border-[var(--accent)]/25 open:shadow-md"
                  >
                    <summary className="cursor-pointer list-none font-semibold text-[var(--primary)] [&::-webkit-details-marker]:hidden">
                      <span className="flex items-start justify-between gap-2">
                        <span>{f.q}</span>
                        <span className="text-[var(--accent)] transition group-open:rotate-180">▼</span>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/75">{f.a}</p>
                  </details>
                ))}
              </div>
              <div className="space-y-3">
                {faqCol2.map((f, i) => (
                  <details
                    key={`b-${i}`}
                    className="group rounded-xl border border-[#0d2137]/10 bg-white px-4 py-3 shadow-sm open:border-[var(--accent)]/25 open:shadow-md"
                  >
                    <summary className="cursor-pointer list-none font-semibold text-[var(--primary)] [&::-webkit-details-marker]:hidden">
                      <span className="flex cursor-pointer items-start justify-between gap-2">
                        <span>{f.q}</span>
                        <span className="text-[var(--accent)] transition group-open:rotate-180">▼</span>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/75">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </article>

        <section className="relative mt-12 overflow-hidden rounded-tr-[2.5rem] bg-gradient-to-br from-[#0d2137] via-[#152a45] to-[#0d2137] px-6 py-12 text-white shadow-xl sm:mt-14 sm:rounded-tr-[4rem] sm:px-10 sm:py-16 lg:rounded-tr-[5rem]">
          <div
            className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-[var(--accent)]/15 blur-3xl"
            aria-hidden
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">{data.howTitle}</h2>
              <ol className="mt-8 space-y-6">
                {data.howSteps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-base font-bold text-[#0d2137]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold">{step.title}</p>
                      <p className="mt-1 text-sm text-white/85">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href={`/${locale}/order`}
                className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:opacity-95"
              >
                {data.howCta}
                <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="relative aspect-[4/3] min-h-[220px] overflow-hidden rounded-2xl ring-2 ring-white/20">
              <Image
                src={data.sceneImageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized={data.sceneImageUrl.startsWith("http")}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-[#0d2137]/20">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-xl ring-4 ring-white/30">
                  <svg className="ml-1 h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
