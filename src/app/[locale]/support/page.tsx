"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function SupportPage() {
  const t = useTranslations("support");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [driverNumber, setDriverNumber] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          driver_number: driverNumber.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setDriverNumber("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-[60vh] bg-[#f5f5f5] px-4 py-12">
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-[#0d2137]/10 bg-white p-6 shadow-sm md:p-8">
            <h1 className="mb-2 text-2xl font-bold text-[#0d2137]">{t("title")}</h1>
            <p className="mb-6 text-[#0d2137]/70">{t("subtitle")}</p>

            {status === "success" && (
              <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-emerald-800">
                {t("success")}
              </div>
            )}
            {status === "error" && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
                {t("error")}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="support-name" className="mb-1 block text-sm font-medium text-[#0d2137]">
                  {t("name")} *
                </label>
                <input
                  id="support-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[#0d2137] focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                />
              </div>
              <div>
                <label htmlFor="support-email" className="mb-1 block text-sm font-medium text-[#0d2137]">
                  {t("email")} *
                </label>
                <input
                  id="support-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[#0d2137] focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                />
              </div>
              <div>
                <label htmlFor="support-driver" className="mb-1 block text-sm font-medium text-[#0d2137]/80">
                  {t("driverNumber")}
                </label>
                <input
                  id="support-driver"
                  type="text"
                  value={driverNumber}
                  onChange={(e) => setDriverNumber(e.target.value)}
                  placeholder={t("driverNumberPlaceholder")}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[#0d2137] focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                />
              </div>
              <div>
                <label htmlFor="support-message" className="mb-1 block text-sm font-medium text-[#0d2137]">
                  {t("message")} *
                </label>
                <textarea
                  id="support-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("messagePlaceholder")}
                  className="w-full resize-y rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[#0d2137] focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-lg bg-[#0d2137] px-4 py-3 font-medium text-white hover:bg-[#0d2137]/90 disabled:opacity-60"
              >
                {status === "sending" ? t("sending") : t("submit")}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#0d2137]/60">
              <Link href="/" className="text-[#0d2137] underline hover:no-underline">
                ← TransPool24
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
