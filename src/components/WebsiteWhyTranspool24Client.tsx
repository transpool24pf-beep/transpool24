"use client";

import { useCallback, useEffect, useState } from "react";
import { locales, type Locale } from "@/i18n/routing";
import { parseFetchJson } from "@/lib/parse-fetch-json";

export function WebsiteWhyTranspool24Client() {
  const [locale, setLocale] = useState<Locale>("de");
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/website/content/why-transpool24?locale=${locale}`);
      const data = await parseFetchJson<{ payload?: unknown; error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Laden fehlgeschlagen");
      setJsonText(JSON.stringify(data.payload, null, 2));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setMessage(null);
    let payload: unknown;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      setMessage("Ungültiges JSON — bitte Syntax prüfen.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/website/content/why-transpool24", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, payload }),
      });
      const data = await parseFetchJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      setMessage("Gespeichert.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const resetToCodeDefaults = async () => {
    if (!confirm("Datenbank-Eintrag für diese Sprache löschen und Code-Standard laden?")) return;
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/website/content/why-transpool24?locale=${locale}`, {
        method: "DELETE",
      });
      const data = await parseFetchJson<{ payload?: unknown; error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Zurücksetzen fehlgeschlagen");
      setJsonText(JSON.stringify(data.payload, null, 2));
      setMessage("Auf Standard zurückgesetzt (nur Anzeige — bei Bedarf speichern).");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Zurücksetzen fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-[#0d2137]">Homepage – Warum TransPool24?</h1>
      <p className="mb-6 text-sm text-[#0d2137]/70">
        Inhalt der Seite{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">/[locale]/why</code> — JSON bearbeiten und speichern.
        Tabelle <code className="rounded bg-[#0d2137]/5 px-1">why_transpool24_locale</code> in Supabase ausführen.
      </p>
      <p className="mb-6 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] px-4 py-3 text-sm text-[#0d2137]/75">
        <strong className="text-[#0d2137]">Abschlussbereich (orange CTA + dunkle Fußzeile):</strong> Wird am Ende aller öffentlichen Seiten mit{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">Footer</code> angezeigt (Startseite, Why, Support, Auftrag, Fahrer, …). Texte pflegen Sie in{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">messages/*.json</code> →{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">infoPageClosing</code>. Footer-Logo (transparent):{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">public/356.png</code> — Austausch per Deployment/Git, nicht im JSON.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-[#0d2137]">Sprache</label>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
        >
          {locales.map((l) => (
            <option key={l} value={l}>
              {l.toUpperCase()}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm font-medium hover:bg-[#0d2137]/5 disabled:opacity-50"
        >
          Neu laden
        </button>
        <button
          type="button"
          onClick={resetToCodeDefaults}
          disabled={saving}
          className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50 disabled:opacity-50"
        >
          Code-Standard
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
        >
          {saving ? "Speichern…" : "Speichern"}
        </button>
      </div>

      {message && (
        <p className={`mb-3 text-sm ${message.startsWith("Gespeichert") ? "text-green-700" : "text-red-700"}`}>
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-[#0d2137]/70">Laden…</p>
      ) : (
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          spellCheck={false}
          className="h-[min(70vh,720px)] w-full rounded-xl border border-[#0d2137]/15 bg-white p-4 font-mono text-xs leading-relaxed text-[#0d2137] shadow-inner focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] sm:text-sm"
        />
      )}
    </div>
  );
}
