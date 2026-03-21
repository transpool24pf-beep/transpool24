"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { DIAL_CODES, buildPhoneE164 } from "@/lib/country-dial-codes";

const INQUIRY_KEYS = ["booking", "driver", "press", "partnership", "other"] as const;
const COMM_KEYS = ["de", "en", "ar", "tr", "fr", "es"] as const;
const COUNTRY_ISOS = [...new Set(DIAL_CODES.map((d) => d.iso))].sort();

export function SupportContactPage() {
  const t = useTranslations("support");
  const locale = useLocale();
  const rtl = locale === "ar";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dial, setDial] = useState("49");
  const [national, setNational] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [inquiry, setInquiry] = useState("");
  const [commLang, setCommLang] = useState("");
  const [message, setMessage] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const [driverNumber, setDriverNumber] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!privacy) {
      setStatus("error");
      setErrorMessage(t("errorPrivacy"));
      return;
    }
    const phoneE164 = buildPhoneE164(dial, national);
    if (!phoneE164) {
      setStatus("error");
      setErrorMessage(t("errorPhone"));
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester_type: isDriver ? "driver" : "customer",
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          email: email.trim(),
          dial,
          national_phone: national.trim(),
          phone_e164: phoneE164,
          company: company.trim(),
          country,
          inquiry_type: inquiry,
          comm_language: commLang,
          page_locale: locale,
          message: message.trim(),
          privacy_accepted: privacy,
          marketing_opt_in: marketing,
          driver_number: isDriver ? driverNumber.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("success");
        setFirstName("");
        setLastName("");
        setEmail("");
        setNational("");
        setCompany("");
        setCountry("");
        setInquiry("");
        setCommLang("");
        setMessage("");
        setPrivacy(false);
        setMarketing(false);
        setDriverNumber("");
        setIsDriver(false);
      } else {
        setStatus("error");
        setErrorMessage(typeof data?.error === "string" ? data.error : t("error"));
      }
    } catch {
      setStatus("error");
      setErrorMessage(t("error"));
    }
  };

  const fieldShell = (label: string, required: boolean, children: React.ReactNode) => (
    <div>
      <div className={`mb-1 flex items-start justify-between gap-2 ${rtl ? "flex-row-reverse" : ""}`}>
        <label className="text-sm font-medium text-[#0d2137]">{label}</label>
        {required && <span className="text-xs text-[#0d2137]/45">{t("requiredShort")}</span>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-white" dir={rtl ? "rtl" : "ltr"}>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#ff8c42] via-[#f07828] to-[#e85d04] px-4 py-14 text-center text-white sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden>
          <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/90">{t("heroBadge")}</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">{t("heroTitle")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/95 sm:text-lg">{t("heroLead")}</p>
          <a
            href="#contact-form"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t("officesTitle")}
          </a>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16" id="contact-form">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div>
            <h2 className="text-2xl font-bold text-[#0d2137]">{t("formTitle")}</h2>

            {status === "success" && (
              <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-emerald-900">{t("success")}</div>
            )}
            {status === "error" && (
              <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-900">{errorMessage || t("error")}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {fieldShell(t("firstName"), true, (
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-3 text-[#0d2137] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                ))}
                {fieldShell(t("lastName"), true, (
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-3 text-[#0d2137] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                ))}
              </div>

              {fieldShell(t("email"), true, (
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-3 text-[#0d2137] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              ))}

              {fieldShell(t("phoneWhatsApp"), true, (
                <div className={`flex gap-2 ${rtl ? "flex-row-reverse" : ""}`}>
                  <select
                    value={dial}
                    onChange={(e) => setDial(e.target.value)}
                    className="w-[min(11rem,42vw)] shrink-0 rounded-lg border border-[#0d2137]/20 bg-white px-2 py-3 text-sm text-[#0d2137] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    aria-label="Country code"
                  >
                    {DIAL_CODES.map((d) => (
                      <option key={`${d.iso}-${d.dial}`} value={d.dial}>
                        {d.flag} +{d.dial}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    value={national}
                    onChange={(e) => setNational(e.target.value)}
                    placeholder={t("phoneHint")}
                    className="min-w-0 flex-1 rounded-lg border border-[#0d2137]/20 px-4 py-3 text-[#0d2137] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
              ))}

              {fieldShell(t("company"), false, (
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={t("companyPlaceholder")}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-3 text-[#0d2137] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              ))}

              {fieldShell(t("country"), true, (
                <select
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-[#0d2137]/20 bg-white px-4 py-3 text-[#0d2137] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">{t("countryPlaceholder")}</option>
                  {COUNTRY_ISOS.map((iso) => (
                    <option key={iso} value={iso}>
                      {t(`countries.${iso}` as "countries.DE")}
                    </option>
                  ))}
                </select>
              ))}

              {fieldShell(t("inquiry"), true, (
                <select
                  required
                  value={inquiry}
                  onChange={(e) => setInquiry(e.target.value)}
                  className="w-full rounded-lg border border-[#0d2137]/20 bg-white px-4 py-3 text-[#0d2137] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">{t("inquiryPlaceholder")}</option>
                  {INQUIRY_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {t(`inquiries.${k}` as "inquiries.booking")}
                    </option>
                  ))}
                </select>
              ))}

              {fieldShell(t("commLanguage"), true, (
                <select
                  required
                  value={commLang}
                  onChange={(e) => setCommLang(e.target.value)}
                  className="w-full rounded-lg border border-[#0d2137]/20 bg-white px-4 py-3 text-[#0d2137] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">{t("commPlaceholder")}</option>
                  {COMM_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {t(`comm.${k}` as "comm.de")}
                    </option>
                  ))}
                </select>
              ))}

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isDriver}
                  onChange={(e) => setIsDriver(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#0d2137]/30 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm text-[#0d2137]/85">{t("driverMode")}</span>
              </label>

              {isDriver && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0d2137]">{t("driverNumber")} *</label>
                  <input
                    type="text"
                    required={isDriver}
                    inputMode="numeric"
                    value={driverNumber}
                    onChange={(e) => setDriverNumber(e.target.value)}
                    placeholder={t("driverNumberPlaceholder")}
                    className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-3 text-[#0d2137] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
              )}

              {fieldShell(t("message"), true, (
                <>
                  <textarea
                    required
                    rows={5}
                    maxLength={500}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("messagePlaceholder")}
                    className="w-full resize-y rounded-lg border border-[#0d2137]/20 px-4 py-3 text-[#0d2137] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <p className="mt-1 text-end text-xs text-[#0d2137]/50">
                    {t("charCount", { current: message.length, max: 500 })}
                  </p>
                </>
              ))}

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => setPrivacy(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#0d2137]/30 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm text-[#0d2137]/85">
                  {t("privacyLabel")}{" "}
                  <Link href={`/${locale}/privacy`} className="font-semibold text-[var(--accent)] underline hover:opacity-90">
                    {t("privacyLink")}
                  </Link>{" "}
                  {t("privacySuffix")}
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#0d2137]/30 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm text-[#0d2137]/75">{t("marketingLabel")}</span>
              </label>

              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-4 text-base font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
              >
                <svg className="h-5 w-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {status === "sending" ? t("sending") : t("submit")}
              </button>
            </form>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-[#0d2137]/10 shadow-lg">
              <div className="relative aspect-[4/3] bg-[#f4f6f8]">
                <Image
                  src="/images/van1.png"
                  alt={t("heroImageAlt")}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 400px"
                />
              </div>
              <div className="border-t border-[#0d2137]/10 bg-white p-6">
                <h3 className="text-lg font-bold text-[#0d2137]">{t("officesTitle")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#0d2137]/70">{t("officesLead")}</p>
                <a
                  href="mailto:transpool24@hotmail.com"
                  className="mt-4 inline-block text-sm font-semibold text-[var(--accent)] hover:underline"
                >
                  transpool24@hotmail.com
                </a>
              </div>
            </div>
          </aside>
        </div>

        <p className="mt-12 text-center text-sm text-[#0d2137]/55">
          <Link href={`/${locale}`} className="hover:text-[var(--accent)] hover:underline">
            ← TransPool24
          </Link>
        </p>
      </div>
    </div>
  );
}
