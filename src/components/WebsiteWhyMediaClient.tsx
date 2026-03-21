"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { locales, type Locale } from "@/i18n/routing";

const IMAGE_UPLOAD = "/api/website/content/why-transpool24/upload-image";
const VIDEO_UPLOAD = "/api/website/content/why-transpool24/upload-video";

export function WebsiteWhyMediaClient() {
  const [locale, setLocale] = useState<Locale>("de");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [sceneImageUrl, setSceneImageUrl] = useState("");
  const [howVideoUrl, setHowVideoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"hero" | "scene" | "video" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/website/content/why-transpool24?locale=${locale}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Laden fehlgeschlagen");
      setHeroImageUrl(data.payload.heroImageUrl || "");
      setSceneImageUrl(data.payload.sceneImageUrl || "");
      setHowVideoUrl(data.payload.howVideoUrl || "");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  const readFileBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });

  const uploadImage = async (kind: "hero" | "scene", file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Bitte ein Bild wählen (JPEG, PNG, WebP).");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      alert("Max. 6 MB.");
      return;
    }
    setUploading(kind);
    setMessage(null);
    try {
      const base64 = await readFileBase64(file);
      const res = await fetch(IMAGE_UPLOAD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, base64, filename: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
      if (data.url) {
        if (kind === "hero") setHeroImageUrl(data.url);
        else setSceneImageUrl(data.url);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(null);
    }
  };

  const uploadVideoFile = async (file: File) => {
    const ok =
      file.type === "video/mp4" ||
      file.type === "video/webm" ||
      file.type === "video/quicktime";
    if (!ok) {
      alert("Nur MP4, WebM oder MOV.");
      return;
    }
    if (file.size > 80 * 1024 * 1024) {
      alert("Max. 80 MB.");
      return;
    }
    setUploading("video");
    setMessage(null);
    try {
      const base64 = await readFileBase64(file);
      const res = await fetch(VIDEO_UPLOAD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, base64, filename: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
      if (data.url) setHowVideoUrl(data.url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/website/content/why-transpool24", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          heroImageUrl,
          sceneImageUrl,
          howVideoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      setMessage("Gespeichert. Änderungen sind auf /" + locale + "/why sichtbar.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-[#0d2137]">Homepage – Medien (Why-Seite)</h1>
      <p className="mb-6 text-sm text-[#0d2137]/70">
        Großes Bild über den FAQs, Poster für den Block „So funktioniert’s“, optional Video (YouTube/Vimeo-Link oder
        hochgeladene MP4/WebM-URL). Speicherort:{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">why-page-media/{`{locale}`}/</code> im Bucket{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">driver-documents</code>.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
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
          onClick={save}
          disabled={saving || loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
        >
          {saving ? "Speichern…" : "Medien speichern"}
        </button>
      </div>

      {message && (
        <p className={`mb-4 text-sm ${message.startsWith("Gespeichert") ? "text-green-700" : "text-red-700"}`}>
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-[#0d2137]/70">Laden…</p>
      ) : (
        <div className="space-y-8">
          <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0d2137]">Großes Bild (über FAQs)</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">Breites Panorama — empfohlen 21:9 oder ähnlich.</p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative h-32 w-full max-w-md overflow-hidden rounded-lg border border-[#0d2137]/10 bg-gray-100 sm:h-36">
                {heroImageUrl ? (
                  <Image src={heroImageUrl} alt="" fill className="object-cover" unoptimized={heroImageUrl.startsWith("http")} />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm text-[#0d2137]/40">Kein Bild</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading === "hero"}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void uploadImage("hero", f);
                  }}
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                />
                <label className="block text-xs font-medium text-[#0d2137]/70">Bild-URL</label>
                <input
                  type="url"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  placeholder="https://… oder /images/van1.png"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0d2137]">Poster / Szenenbild („So funktioniert’s“)</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">
              Wird als Vorschaubild gezeigt; bei YouTube/Vimeo öffnet Klick auf Play das eingebettete Video.
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-lg border border-[#0d2137]/10 bg-gray-100">
                {sceneImageUrl ? (
                  <Image src={sceneImageUrl} alt="" fill className="object-cover" unoptimized={sceneImageUrl.startsWith("http")} />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm text-[#0d2137]/40">Kein Bild</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading === "scene"}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void uploadImage("scene", f);
                  }}
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                />
                <label className="block text-xs font-medium text-[#0d2137]/70">Bild-URL</label>
                <input
                  type="url"
                  value={sceneImageUrl}
                  onChange={(e) => setSceneImageUrl(e.target.value)}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  placeholder="https://… oder /images/van2.png"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0d2137]">Video</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">
              YouTube- oder Vimeo-Link (z. B. https://www.youtube.com/watch?v=…) oder direkte .mp4/.webm-URL (z. B. nach
              Upload unten). Leer lassen = nur Poster mit dekorativem Play-Icon.
            </p>
            <textarea
              value={howVideoUrl}
              onChange={(e) => setHowVideoUrl(e.target.value)}
              rows={3}
              className="mt-3 w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm font-mono"
              placeholder="https://www.youtube.com/watch?v=…"
            />
            <div className="mt-3">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                disabled={uploading === "video"}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void uploadVideoFile(f);
                }}
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#0d2137] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
              />
              <p className="mt-2 text-xs text-[#0d2137]/60">MP4, WebM oder MOV, max. 80 MB. Nach Upload erscheint die öffentliche URL im Feld oben.</p>
            </div>
            <button
              type="button"
              onClick={() => setHowVideoUrl("")}
              className="mt-3 text-sm text-[var(--accent)] hover:underline"
            >
              Video-URL leeren
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
