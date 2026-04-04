"use client";

import { useEffect, useState } from "react";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";

type Payload = {
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  emailPrimary: string;
  emailSecondary: string;
};

export default function AdminEmailSocialPage() {
  const { t } = useAdminLocale();
  const [form, setForm] = useState<Payload>({
    instagramUrl: "",
    tiktokUrl: "",
    linkedinUrl: "",
    emailPrimary: "",
    emailSecondary: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/email-social")
      .then((r) => r.json())
      .then((d: Payload & { error?: string }) => {
        if (d.error) throw new Error(d.error);
        setForm({
          instagramUrl: d.instagramUrl ?? "",
          tiktokUrl: d.tiktokUrl ?? "",
          linkedinUrl: d.linkedinUrl ?? "",
          emailPrimary: d.emailPrimary ?? "",
          emailSecondary: d.emailSecondary ?? "",
        });
      })
      .catch(() => setMessage({ type: "err", text: t("emailSocial.loadError") }))
      .finally(() => setLoading(false));
  }, [t]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email-social", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      setForm({
        instagramUrl: d.instagramUrl ?? "",
        tiktokUrl: d.tiktokUrl ?? "",
        linkedinUrl: d.linkedinUrl ?? "",
        emailPrimary: d.emailPrimary ?? "",
        emailSecondary: d.emailSecondary ?? "",
      });
      setMessage({ type: "ok", text: t("emailSocial.saved") });
    } catch (e) {
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : t("emailSocial.saveError"),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-[#0d2137]/70">{t("emailSocial.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2137]">{t("emailSocial.title")}</h1>
        <p className="mt-2 text-sm text-[#0d2137]/70">{t("emailSocial.subtitle")}</p>
      </div>

      {message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            message.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="space-y-4 rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[#0d2137]">{t("emailSocial.sectionSocial")}</p>
        <label className="block text-sm">
          <span className="font-medium text-[#0d2137]">Instagram</span>
          <input
            type="url"
            className="mt-1 w-full rounded-lg border border-[#0d2137]/15 px-3 py-2 text-sm"
            value={form.instagramUrl}
            onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
            placeholder="https://www.instagram.com/..."
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#0d2137]">TikTok</span>
          <input
            type="url"
            className="mt-1 w-full rounded-lg border border-[#0d2137]/15 px-3 py-2 text-sm"
            value={form.tiktokUrl}
            onChange={(e) => setForm((f) => ({ ...f, tiktokUrl: e.target.value }))}
            placeholder="https://www.tiktok.com/@..."
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#0d2137]">LinkedIn</span>
          <input
            type="url"
            className="mt-1 w-full rounded-lg border border-[#0d2137]/15 px-3 py-2 text-sm"
            value={form.linkedinUrl}
            onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
            placeholder="https://www.linkedin.com/..."
          />
        </label>

        <p className="pt-2 text-sm font-semibold text-[#0d2137]">{t("emailSocial.sectionEmails")}</p>
        <label className="block text-sm">
          <span className="font-medium text-[#0d2137]">{t("emailSocial.emailPrimary")}</span>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-[#0d2137]/15 px-3 py-2 text-sm"
            value={form.emailPrimary}
            onChange={(e) => setForm((f) => ({ ...f, emailPrimary: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#0d2137]">{t("emailSocial.emailSecondary")}</span>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-[#0d2137]/15 px-3 py-2 text-sm"
            value={form.emailSecondary}
            onChange={(e) => setForm((f) => ({ ...f, emailSecondary: e.target.value }))}
          />
        </label>

        <p className="text-xs text-[#0d2137]/55">{t("emailSocial.hint")}</p>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[#0d2137] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t("emailSocial.saving") : t("emailSocial.save")}
        </button>
      </div>
    </div>
  );
}
