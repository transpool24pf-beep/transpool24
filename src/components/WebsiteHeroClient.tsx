"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const LOCALES = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "tr", label: "Türkçe" },
] as const;

type HeroData = {
  imageUrl: string | null;
  headline: Record<string, string>;
  subtitle: Record<string, string>;
  cta: Record<string, string>;
};

const UPLOAD_URL = "/api/website/content/hero/upload";
const API_BASE = "/api/website/content/hero";

export function WebsiteHeroClient() {
  const [data, setData] = useState<HeroData>({
    imageUrl: null,
    headline: {},
    subtitle: {},
    cta: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    fetch(API_BASE)
      .then((r) => r.json())
      .then((res) =>
        setData({
          imageUrl: res.imageUrl ?? null,
          headline: res.headline ?? {},
          subtitle: res.subtitle ?? {},
          cta: res.cta ?? {},
        }),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Bitte ein Bild wählen (JPEG, PNG oder WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Datei zu groß (max. 5 MB).");
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
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("Gespeichert. Änderungen sind auf der Startseite sichtbar.");
      } else {
        const body = await res.json().catch(() => ({}));
        alert((body as { error?: string }).error || "Speichern fehlgeschlagen.");
      }
    } catch {
      alert("Anfrage fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (
    group: "headline" | "subtitle" | "cta",
    locale: string,
    value: string,
  ) => {
    setData((prev) => ({
      ...prev,
      [group]: { ...prev[group], [locale]: value },
    }));
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
          Hintergrundbild und Texte (Überschrift, Untertitel, Button) für den Hero-Bereich. Leere Felder nutzen die Standard-Texte aus den Übersetzungen.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-[#0d2137]">Hintergrundbild</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative h-48 w-full max-w-sm shrink-0 overflow-hidden rounded-xl border-2 border-[#0d2137]/10 bg-gray-100">
              {data.imageUrl ? (
                <Image
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
                JPEG/PNG/WebP, max. 5 MB. Querformat empfohlen.
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
          <h2 className="mb-4 text-lg font-medium text-[#0d2137]">Texte pro Sprache</h2>
          <p className="mb-6 text-sm text-[#0d2137]/70">
            Nur ausfüllen, wenn Sie die Standard-Texte überschreiben möchten.
          </p>
          <div className="space-y-6">
            {LOCALES.map(({ code, label }) => (
              <div
                key={code}
                className="rounded-lg border border-[#0d2137]/10 bg-[#f8fafc] p-4"
              >
                <h3 className="mb-3 text-sm font-semibold text-[#0d2137]">{label} ({code})</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#0d2137]/70">Überschrift</label>
                    <input
                      type="text"
                      value={data.headline[code] ?? ""}
                      onChange={(e) => updateField("headline", code, e.target.value)}
                      placeholder="z. B. Ihr Logistikpartner in Pforzheim"
                      className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#0d2137]/70">Untertitel</label>
                    <input
                      type="text"
                      value={data.subtitle[code] ?? ""}
                      onChange={(e) => updateField("subtitle", code, e.target.value)}
                      placeholder="z. B. Schnell, zuverlässig, transparent."
                      className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#0d2137]/70">Button-Text</label>
                    <input
                      type="text"
                      value={data.cta[code] ?? ""}
                      onChange={(e) => updateField("cta", code, e.target.value)}
                      placeholder="z. B. Jetzt Auftrag buchen"
                      className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[var(--accent)] px-8 py-3 font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-60"
        >
          {saving ? "Speichern…" : "Speichern & Veröffentlichen"}
        </button>
      </form>
    </div>
  );
}
