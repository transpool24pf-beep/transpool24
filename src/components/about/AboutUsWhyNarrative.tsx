import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DotLottieRow } from "@/components/blog/DotLottieRow";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

const LOTTIE_1 =
  "https://lottie.host/2b45c4cf-8d1b-4aff-b2a9-b2051fdcfaa7/y9NIyXNNR2.lottie";
const LOTTIE_2 =
  "https://lottie.host/458c62f4-7371-43f1-b3b7-c3e39d87883a/TUdNTQ1KvT.lottie";

type Props = {
  locale: string;
  /** Inside blog card: omit bottom border on inner wrapper. */
  embedded?: boolean;
};

function isRtlLocale(locale: string): boolean {
  return locale === "ar" || locale === "ku";
}

/**
 * «About us» narrative on /[locale]/why and optional blog block — all locales via messages/*.json → aboutNarrative.
 */
export async function AboutUsWhyNarrative({ locale, embedded = false }: Props) {
  const loc = locale as Locale;
  if (!routing.locales.includes(loc)) {
    return null;
  }
  const t = await getTranslations({ locale: loc, namespace: "aboutNarrative" });
  const rtl = isRtlLocale(loc);

  return (
    <div
      className={`${embedded ? "" : "border-b border-[#0d2137]/6 "}bg-gradient-to-br from-[#f8fafc] via-white to-[#e85d04]/[0.06] px-6 py-10 sm:px-10 sm:py-12`}
      dir={rtl ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-3xl text-center">
        <div className="relative mx-auto inline-block rounded-[1.35rem] bg-gradient-to-br from-[#0d2137]/[0.08] via-white to-[#e85d04]/[0.14] p-6 shadow-[0_24px_56px_-28px_rgba(13,33,55,0.28)] ring-1 ring-black/[0.07] sm:p-8">
          <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-2xl bg-white/95 shadow-inner ring-1 ring-[#0d2137]/8 sm:h-44 sm:w-44">
            <Image
              src="/images/123.png"
              alt="TransPool24"
              width={176}
              height={176}
              className="object-contain p-3"
              priority={!embedded}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-3xl text-[var(--foreground)]">
        <p className="text-lg leading-relaxed text-[var(--foreground)]/85 whitespace-pre-line">{t("intro1")}</p>
        <p className="mt-4 text-base leading-relaxed text-[var(--foreground)]/78 whitespace-pre-line">{t("intro2")}</p>
      </div>

      <div className="mx-auto max-w-4xl">
        <DotLottieRow primarySrc={LOTTIE_1} secondarySrc={LOTTIE_2} />
      </div>

      <div className="mx-auto max-w-3xl space-y-8 text-[var(--foreground)]">
        <section>
          <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">{t("strategicTitle")}</h2>
          <p className="mt-4 leading-relaxed text-[var(--foreground)]/82 whitespace-pre-line">{t("strategicLead")}</p>
          <ul className="mt-4 list-disc space-y-3 ps-6 leading-relaxed text-[var(--foreground)]/80">
            <li className="whitespace-pre-line">{t("bulletAutomation")}</li>
            <li className="whitespace-pre-line">{t("bulletTransparency")}</li>
            <li className="whitespace-pre-line">{t("bulletSocial")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">{t("dailyOpsTitle")}</h2>
          <p className="mt-4 leading-relaxed text-[var(--foreground)]/82 whitespace-pre-line">{t("dailyOpsLead")}</p>
          <ul className="mt-4 list-disc space-y-3 ps-6 leading-relaxed text-[var(--foreground)]/80">
            <li className="whitespace-pre-line">{t("dailyOpsB1")}</li>
            <li className="whitespace-pre-line">{t("dailyOpsB2")}</li>
            <li className="whitespace-pre-line">{t("dailyOpsB3")}</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold text-[var(--primary)] sm:text-xl whitespace-pre-line">
            {t("csrTitle")}
          </h3>
          <p className="mt-3 leading-relaxed text-[var(--foreground)]/80 whitespace-pre-line">{t("csrLead")}</p>
          <ul className="mt-4 list-disc space-y-3 ps-6 leading-relaxed text-[var(--foreground)]/80">
            <li className="whitespace-pre-line">{t("csrJobs")}</li>
            <li className="whitespace-pre-line">{t("csrUnemployment")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--primary)] sm:text-2xl">{t("federalTitle")}</h2>
          <p className="mt-4 leading-relaxed text-[var(--foreground)]/82 whitespace-pre-line">{t("federalP")}</p>
        </section>

        <p className="rounded-xl bg-[#fafbfc] px-5 py-4 text-center text-base font-semibold text-[var(--primary)] ring-1 ring-[#0d2137]/8">
          <span className="text-[var(--accent)]">TransPool24</span> — {t("ctaPrefix")}{" "}
          <Link
            href={`/${loc}/order`}
            className="text-[var(--accent)] underline underline-offset-2 hover:opacity-90"
          >
            {t("ctaLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
