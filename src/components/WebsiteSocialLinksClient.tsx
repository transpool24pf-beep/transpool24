"use client";

import { useCallback, useEffect, useState } from "react";
import { parseFetchJson } from "@/lib/parse-fetch-json";
import type { SiteSocialMediaPayload } from "@/lib/site-social-media";

const empty: SiteSocialMediaPayload = {
  instagramUrl: "",
  tiktokUrl: "",
  linkedinUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
};

export function WebsiteSocialLinksClient() {
  const [social, setSocial] = useState<SiteSocialMediaPayload>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/website/content/social-media");
      const data = await parseFetchJson<{ social?: SiteSocialMediaPayload; error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Laden fehlgeschlagen");
      setSocial(data.social ?? empty);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/website/content/social-media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(social),
      });
      const data = await parseFetchJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      setMessage("Gespeichert. Links erscheinen im Footer auf der Website.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof SiteSocialMediaPayload, label: string, placeholder: string) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#0d2137]">{label}</span>
      <input
        type="url"
        value={social[key]}
        onChange={(e) => setSocial((s) => ({ ...s, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm text-[#0d2137] placeholder:text-[#0d2137]/40"
      />
    </label>
  );

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-[#0d2137]">Social Media (Footer)</h1>
      <p className="mb-6 text-sm text-[#0d2137]/70">
        URLs für Instagram, TikTok, LinkedIn, Facebook und YouTube. Leere Felder werden im Footer nicht angezeigt. Tabelle{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">site_social_media</code> in Supabase ausführen (
        <code className="rounded bg-[#0d2137]/5 px-1">supabase/site_social_media.sql</code>).
      </p>

      {loading ? (
        <p className="text-[#0d2137]/70">Laden…</p>
      ) : (
        <div className="space-y-4 rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          {field("instagramUrl", "Instagram", "https://instagram.com/…")}
          {field("tiktokUrl", "TikTok", "https://www.tiktok.com/@…")}
          {field("linkedinUrl", "LinkedIn", "https://www.linkedin.com/…")}
          {field("facebookUrl", "Facebook", "https://www.facebook.com/…")}
          {field("youtubeUrl", "YouTube", "https://www.youtube.com/…")}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
          >
            {saving ? "Speichern…" : "Speichern"}
          </button>
        </div>
      )}

      {message && (
        <p
          className={`mt-4 text-sm ${message.startsWith("Gespeichert") ? "text-green-700" : "text-red-700"}`}
        >
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() => load()}
        disabled={loading}
        className="mt-4 text-sm text-[#0d2137]/70 underline hover:text-[#0d2137] disabled:opacity-50"
      >
        Neu laden
      </button>
    </div>
  );
}
