"use client";

import { useState } from "react";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";

export default function AdminCustomerEmailPage() {
  const { t } = useAdminLocale();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const send = async () => {
    setStatus("idle");
    setErrorMsg("");
    setSending(true);
    try {
      const res = await fetch("/api/admin/send-customer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || t("customerEmail.sendError"));
      setStatus("ok");
      setMessage("");
      setSubject("");
    } catch (e) {
      setStatus("err");
      setErrorMsg(e instanceof Error ? e.message : t("customerEmail.sendError"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0d2137]">{t("customerEmail.title")}</h1>
        <p className="mt-2 text-sm text-[#0d2137]/70">{t("customerEmail.subtitle")}</p>
        <p className="mt-3 rounded-lg border border-[#0d2137]/10 bg-[#f8fafc] px-4 py-3 text-xs leading-relaxed text-[#0d2137]/75">
          {t("customerEmail.fromHint")}
        </p>
      </header>

      <div className="space-y-4 rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#0d2137]">{t("customerEmail.to")}</span>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="kunde@firma.de"
            className="w-full rounded-lg border border-[#0d2137]/15 px-3 py-2.5 text-sm outline-none focus:border-[#e85d04]/50 focus:ring-2 focus:ring-[#e85d04]/20"
            autoComplete="off"
            dir="ltr"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#0d2137]">{t("customerEmail.subject")}</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("customerEmail.subjectPlaceholder")}
            className="w-full rounded-lg border border-[#0d2137]/15 px-3 py-2.5 text-sm outline-none focus:border-[#e85d04]/50 focus:ring-2 focus:ring-[#e85d04]/20"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#0d2137]">{t("customerEmail.message")}</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
            placeholder={t("customerEmail.messagePlaceholder")}
            className="w-full resize-y rounded-lg border border-[#0d2137]/15 px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-[#e85d04]/50 focus:ring-2 focus:ring-[#e85d04]/20"
          />
        </label>

        {status === "ok" ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {t("customerEmail.sent")}
          </p>
        ) : null}
        {status === "err" ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{errorMsg}</p>
        ) : null}

        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || !to.trim() || !subject.trim() || !message.trim()}
          className="rounded-xl bg-[#e85d04] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? t("customerEmail.sending") : t("customerEmail.send")}
        </button>
      </div>
    </div>
  );
}
