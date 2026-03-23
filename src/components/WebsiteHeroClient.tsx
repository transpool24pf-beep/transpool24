"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { WEBSITE_CMS_LOCALE_OPTIONS } from "@/lib/website-cms-locales";

type HeroData = {
  imageUrl: string | null;
  headline: Record<string, string>;
  subtitle: Record<string, string>;
  cta: Record<string, string>;
};

type EnglishFields = { headline: string; subtitle: string; cta: string };

const UPLOAD_URL = "/api/website/content/hero/upload";
const API_BASE = "/api/website/content/hero";

function pickEnglishSource(d: HeroData): EnglishFields {
  return {
    headline: d.headline.en?.trim() || "",
    subtitle: d.subtitle.en?.trim() || "",
    cta: d.cta.en?.trim() || "",
  };
}

export function WebsiteHeroClient() {
  const [data, setData] = useState<HeroData>({
    imageUrl: null,
    headline: {},
    subtitle: {},
    cta: {},
  });
  const [english, setEnglish] = useState<EnglishFields>({
    headline: "",
    subtitle: "",
    cta: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const load = () =>
    fetch(API_BASE)
      .then((r) => r.json())
      .then((res) => {
        const next: HeroData = {
          imageUrl: res.imageUrl ?? null,
          headline: res.headline ?? {},
          subtitle: res.subtitle ?? {},
          cta: res.cta ?? {},
        };
        setData(next);
        setEnglish(pickEnglishSource(next));
      })
      .catch(() => {});

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Bitte ein Bild wählen (JPEG, PNG oder WebP).");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      alert("Datei zu groß (max. 12 MB).");
      return;
    }
    setImageUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const res = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: dataUrl, filename: file.name }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(body.error || "Upload fehlgeschlagen.");
      if (body.url) setData((prev) => ({ ...prev, imageUrl: body.url! }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(API_BASE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: data.imageUrl,
          heroEnglish: english,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        translationFallback?: boolean;
      };
      if (res.ok) {
        await load();
        let msg =
          "Gespeichert. Startseite lädt Hero jetzt live aus der Datenbank (kein Build nötig).";
        if (body.translationFallback) {
          msg +=
            "\n\nHinweis: Ohne DEEPL_AUTH_KEY oder GOOGLE_TRANSLATE_API_KEY wird MyMemory genutzt (begrenzt). Für stabile Übersetzungen DeepL empfohlen.";
        }
        alert(msg);
      } else {
        alert(body.error || "Speichern fehlgeschlagen.");
      }
    } catch {
      alert("Anfrage fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <p className="text-[#0d2137]/70">Laden…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0d2137]">Homepage – Hero</h1>
        <p className="mt-1 text-sm text-[#0d2137]/70">
          Hintergrundbild und Texte für den Hero. Texte nur auf Englisch eingeben — beim Speichern werden alle
          Sprachen automatisch übersetzt (DeepL, sonst Google, sonst MyMemory).
        </p>
        <p className="mt-1 text-sm text-[#0d2137]/70" dir="rtl">
          صورة الخلفية والنصوص. أدخل النصوص بالإنجليزية فقط؛ عند الحفظ تُترجم تلقائياً لكل اللغات.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-[#0d2137]">Hintergrundbild</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative h-48 w-full max-w-sm shrink-0 overflow-hidden rounded-xl border-2 border-[#0d2137]/10 bg-gray-100">
              {data.imageUrl ? (
                <Image
                  key={data.imageUrl}
                  src={data.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized={data.imageUrl.startsWith("http")}
                  sizes="400px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm text-[#0d2137]/40">
                  Kein Bild – Standard wird verwendet
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageFile}
                disabled={imageUploading}
                className="block w-full text-sm text-[#0d2137] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-95 disabled:opacity-50"
              />
              <p className="text-xs text-[#0d2137]/60">
                JPEG/PNG/WebP, max. 12 MB — lieber hohe Auflösung (z. B. 2400px+ Breite), minimal komprimiert. Nach
                Upload „Speichern“.
              </p>
              <p className="text-xs text-[#0d2137]/55" dir="rtl">
                يُفضَّل صورة عريضة عالية الدقة (مثلاً 2400 بكسل فأكثر) وبأقل ضغط ممكن؛ الحد الأقصى 12 ميجابايت.
              </p>
              <input
                type="url"
                placeholder="Oder URL einfügen"
                value={data.imageUrl ?? ""}
                onChange={(e) => setData((prev) => ({ ...prev, imageUrl: e.target.value.trim() || null }))}
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-medium text-[#0d2137]">Hero-Texte (nur Englisch)</h2>
          <p className="mb-6 text-sm text-[#0d2137]/65">
            Leer lassen = keine CMS-Texte, die Website nutzt dann die Standard-Übersetzungen aus den Sprachdateien.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#0d2137]/70">Headline (EN)</label>
              <input
                type="text"
                value={english.headline}
                onChange={(e) => setEnglish((p) => ({ ...p, headline: e.target.value }))}
                placeholder="e.g. Your logistics partner in Pforzheim"
                className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#0d2137]/70">Subtitle (EN)</label>
              <input
                type="text"
                value={english.subtitle}
                onChange={(e) => setEnglish((p) => ({ ...p, subtitle: e.target.value }))}
                placeholder="e.g. Fast, reliable, transparent."
                className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#0d2137]/70">Button (EN)</label>
              <input
                type="text"
                value={english.cta}
                onChange={(e) => setEnglish((p) => ({ ...p, cta: e.target.value }))}
                placeholder="e.g. Book now"
                className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <details className="mt-8 rounded-lg border border-[#0d2137]/10 bg-[#f8fafc] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#0d2137]">
              Alle Sprachen (Vorschau nach Speichern)
            </summary>
            <p className="mt-2 text-xs text-[#0d2137]/60" dir="rtl">
              معاينة لكل اللغة بعد الحفظ
            </p>
            <div className="mt-4 space-y-4">
              {WEBSITE_CMS_LOCALE_OPTIONS.map(({ code, label }) => (
                <div key={code} className="rounded-md border border-[#0d2137]/8 bg-white p-3 text-xs">
                  <p className="mb-2 font-semibold text-[#0d2137]">
                    {label} ({code})
                  </p>
                  <p>
                    <span className="text-[#0d2137]/55">Titel: </span>
                    {data.headline[code] || "—"}
                  </p>
                  <p className="mt-1">
                    <span className="text-[#0d2137]/55">Untertitel: </span>
                    {data.subtitle[code] || "—"}
                  </p>
                  <p className="mt-1">
                    <span className="text-[#0d2137]/55">Button: </span>
                    {data.cta[code] || "—"}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[var(--accent)] px-8 py-3 font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-60"
        >
          {saving ? "Speichern & übersetzen…" : "Speichern & alle Sprachen übersetzen"}
        </button>
      </form>
    </div>
  );
}
