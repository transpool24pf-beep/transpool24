"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { locales, type Locale } from "@/i18n/routing";
import { localeCmsSelectLabel } from "@/lib/locale-display";
import { parseFetchJson } from "@/lib/parse-fetch-json";

export function WebsiteWhyTranspool24Client() {
  const [locale, setLocale] = useState<Locale>("de");
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /** Same full JSON written to every locale row (text will be identical everywhere — use only if intended) */
  const [applyToAllLocales, setApplyToAllLocales] = useState(false);

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
    if (
      applyToAllLocales &&
      !confirm(
        "Alle Sprachen erhalten genau dieses JSON — Überschriften/FAQ-Texte sind dann überall gleich (z. B. nur Deutsch auf /ar/why).\n\n" +
          "Für Bilder/Video lieber „Homepage – Medien (Why)“ mit „Alle Sprachen“ nutzen.\n\nTrotzdem speichern?"
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/website/content/why-transpool24", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, payload, applyToAllLocales }),
      });
      const data = await parseFetchJson<{
        error?: string;
        applyToAllLocales?: boolean;
        localesUpdated?: string[];
      }>(res);
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      if (data.applyToAllLocales && Array.isArray(data.localesUpdated)) {
        setMessage(`Gespeichert für alle ${data.localesUpdated.length} Sprachen.`);
      } else {
        setMessage("Gespeichert.");
      }
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
      setMessage(
        "Zurückgesetzt: DB-Eintrag gelöscht. Öffentliche /[locale]/why nutzt jetzt den Code-Standard — kein erneutes Speichern nötig.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Zurücksetzen fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-[#0d2137]">Homepage – Warum TransPool24?</h1>

      <div className="mb-6 flex flex-col gap-3 rounded-xl border-2 border-[var(--accent)] bg-gradient-to-br from-[var(--accent)]/12 to-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="text-sm text-[#0d2137]" dir="rtl">
          <p className="font-bold text-[#0d2137]">صور وفيديو صفحة «لماذا»؟</p>
          <p className="mt-1 text-[#0d2137]/85">
            ليست هنا — افتح صفحة <strong>الوسائط</strong> من القائمة الجانبية أو الزر أدناه. هناك: صورة البانوراما، صورة
            المشهد، ورفع الفيديو + خيار <strong>تطبيق على كل اللغات</strong>.
          </p>
        </div>
        <div className="text-sm text-[#0d2137]/90">
          <p className="font-semibold text-[#0d2137]">Bilder &amp; Video für /why?</p>
          <p className="mt-1">
            Nicht auf dieser Seite — öffnen Sie{" "}
            <strong>Homepage – Medien (Why)</strong> (Sidebar oder Button). Pfad:{" "}
            <code className="rounded bg-[#0d2137]/10 px-1 text-xs">/website/why-media</code>
          </p>
        </div>
        <Link
          href="/website/why-media"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-center text-sm font-bold text-white shadow-md transition hover:opacity-95"
        >
          <span dir="rtl">→ صور وفيديو</span>
          <span className="opacity-90">·</span>
          <span>Medien (Why) →</span>
        </Link>
      </div>

      <p className="mb-6 text-sm text-[#0d2137]/70">
        Inhalt der Seite{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">/[locale]/why</code> — JSON bearbeiten und speichern.
        Gespeicherte Zeilen in <code className="rounded bg-[#0d2137]/5 px-1">why_transpool24_locale</code>{" "}
        <strong>überschreiben</strong> die Texte aus dem Code (
        <code className="rounded bg-[#0d2137]/5 px-1">src/lib/why-defaults-*.ts</code>
        ). Zeigt die Live-Seite noch alte Texte (z. B. Möbel / „zerbrechlich“)? Sprache wählen →{" "}
        <strong>Code-Standard</strong> — dann ist der DB-Eintrag gelöscht und die Seite nutzt sofort die neuen
        B2B-Standardtexte. Außerdem: gespeicherte JSON ohne{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">contentRevision</code> ≥ aktuellem Stand im Code werden
        automatisch ignoriert — die Live-Seite zeigt dann die Standardtexte aus dem Repository.
      </p>
      <div
        className="mb-6 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-3 text-sm text-[#0d2137]"
        dir="rtl"
      >
        <p className="mb-2 font-semibold text-[#0d2137]">لماذا قائمة «اللغة»؟</p>
        <p className="mb-2 text-[#0d2137]/85">
          محتوى JSON يحتوي عناوين ونصوصاً <strong>مترجمة لكل لغة</strong> (عربي، ألماني، …). تختار اللغة لتحميل وتحرير{" "}
          <strong>نسخة تلك اللغة</strong> ثم تحفظ عادةً <strong>لهذه اللغة فقط</strong>.
        </p>
        <p className="text-[#0d2137]/85">
          لتغيير <strong>الصور والفيديو</strong>:{" "}
          <Link href="/website/why-media" className="font-bold text-[var(--accent)] underline underline-offset-2">
            اضغط للانتقال إلى صفحة الوسائط
          </Link>{" "}
          (أو من القائمة: <strong>Homepage – Medien (Why)</strong>) وفعّل{" "}
          <strong>«تطبيق على كل اللغات»</strong> عند الحفظ.
        </p>
      </div>
      <p className="mb-4 rounded-lg border border-[#0d2137]/10 bg-white px-4 py-3 text-sm text-[#0d2137]/80">
        <strong className="text-[#0d2137]">Warum „Sprache“-Auswahl?</strong> Das JSON enthält Überschriften und Texte pro
        Sprache. Sie wählen die Sprache, um <strong>deren Version</strong> zu laden und zu bearbeiten — Speichern gilt
        standardmäßig nur für diese Sprache. Bilder/Video für <strong>alle</strong> Sprachen: Seite{" "}
        <strong>Homepage – Medien (Why)</strong> mit Checkbox „Alle Sprachen“.
      </p>

      <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={applyToAllLocales}
            onChange={(e) => setApplyToAllLocales(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[#0d2137]/30 text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <span className="text-sm text-[#0d2137]">
            <strong className="font-semibold">Dieses JSON für alle {locales.length} Sprachen speichern</strong>
            <span className="mt-1 block text-[#0d2137]/75">
              Nur sinnvoll, wenn die Texte absichtlich überall gleich sein sollen. Sonst pro Sprache einzeln speichern
              oder Medien-Seite nutzen.
            </span>
          </span>
        </label>
      </div>

      <p className="mb-6 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] px-4 py-3 text-sm text-[#0d2137]/75">
        <strong className="text-[#0d2137]">Abschlussbereich (orange CTA + dunkle Fußzeile):</strong> Wird am Ende aller öffentlichen Seiten mit{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">Footer</code> angezeigt (Startseite, Why, Support, Auftrag, Fahrer, …). Texte pflegen Sie in{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">messages/*.json</code> →{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">infoPageClosing</code>. Footer-Logo (transparent):{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">public/356.png</code> (PNG, unten rechts ohne Dekor-Pixel) — per Deployment/Git, nicht im JSON.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-[#0d2137]">Sprache (laden / bearbeiten)</label>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
        >
          {locales.map((l) => (
            <option key={l} value={l}>
              {localeCmsSelectLabel(l)}
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
        <p
          className={`mb-3 text-sm ${
            message.startsWith("Gespeichert") || message.startsWith("Zurückgesetzt") ? "text-green-700" : "text-red-700"
          }`}
        >
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
