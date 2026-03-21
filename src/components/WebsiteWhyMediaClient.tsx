"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { locales, type Locale } from "@/i18n/routing";
import { parseFetchJson } from "@/lib/parse-fetch-json";
import { putFileToSupabaseSignedUrl } from "@/lib/upload-supabase-signed-url";
import { normalizeWhyAssetUrl } from "@/lib/why-asset-url";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

type PresignOk = { signedUrl: string; publicUrl: string; error?: string };

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
      const data = await parseFetchJson<{ payload?: { heroImageUrl?: string; sceneImageUrl?: string; howVideoUrl?: string }; error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Laden fehlgeschlagen");
      setHeroImageUrl(normalizeWhyAssetUrl(data.payload?.heroImageUrl || ""));
      setSceneImageUrl(normalizeWhyAssetUrl(data.payload?.sceneImageUrl || ""));
      setHowVideoUrl((data.payload?.howVideoUrl || "").trim());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  const presignAndUpload = async (file: File, kind: "image" | "video", slot: "hero" | "scene" | "video") => {
    if (kind === "image" && file.size > MAX_IMAGE_BYTES) {
      alert(`Bild max. ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`);
      return;
    }
    if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
      alert(`Video max. ${MAX_VIDEO_BYTES / (1024 * 1024)} MB.`);
      return;
    }

    setUploading(slot);
    setMessage(null);
    try {
      const pres = await fetch("/api/website/content/why-transpool24/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          filename: file.name,
          contentType: file.type || (kind === "image" ? "image/jpeg" : "video/mp4"),
          kind,
          fileSize: file.size,
        }),
      });
      const j = await parseFetchJson<PresignOk>(pres);
      if (!pres.ok || !j.signedUrl) throw new Error(j.error || "Presign fehlgeschlagen");
      await putFileToSupabaseSignedUrl(j.signedUrl, file, true);
      const pub = j.publicUrl;
      if (!pub) throw new Error("Keine öffentliche URL zurückgegeben.");
      if (slot === "hero") setHeroImageUrl(pub);
      else if (slot === "scene") setSceneImageUrl(pub);
      else setHowVideoUrl(pub);
      setMessage("Upload fertig — bitte „Medien speichern“ klicken, damit die Seite die URLs in der Datenbank hat.");
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
          heroImageUrl: normalizeWhyAssetUrl(heroImageUrl),
          sceneImageUrl: normalizeWhyAssetUrl(sceneImageUrl),
          howVideoUrl: howVideoUrl.trim(),
        }),
      });
      const data = await parseFetchJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      setMessage(`Gespeichert. Seite /${locale}/why lädt Inhalte live aus der Datenbank (nicht aus dem Build-Cache).`);
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
        Uploads gehen <strong>direkt zu Supabase</strong> (signierte URL) — umgeht das Vercel-Limit für große Dateien.
        Lokale Bilder bitte als <code className="rounded bg-[#0d2137]/5 px-1">/images/…</code> eintragen, nicht{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">./images/…</code>. Speicherort:{" "}
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
        <p
          className={`mb-4 text-sm ${
            message.startsWith("Gespeichert") || message.startsWith("Upload fertig") ? "text-green-700" : "text-red-700"
          }`}
        >
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-[#0d2137]/70">Laden…</p>
      ) : (
        <div className="space-y-8">
          <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0d2137]">Großes Bild (über FAQs)</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">Breites Panorama — empfohlen 21:9 oder ähnlich. Max. 15 MB.</p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative h-32 w-full max-w-md overflow-hidden rounded-lg border border-[#0d2137]/10 bg-gray-100 sm:h-36">
                {heroImageUrl ? (
                  <Image
                    src={heroImageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={heroImageUrl.startsWith("http")}
                  />
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
                    if (f) void presignAndUpload(f, "image", "hero");
                  }}
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                />
                <label className="block text-xs font-medium text-[#0d2137]/70">Bild-URL</label>
                <input
                  type="text"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  onBlur={() => setHeroImageUrl(normalizeWhyAssetUrl(heroImageUrl))}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  placeholder="https://… oder /images/van1.png"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0d2137]">Poster / Szenenbild („So funktioniert’s“)</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">
              Vorschaubild; bei YouTube/Vimeo öffnet Play das eingebettete Video. Max. 15 MB.
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-lg border border-[#0d2137]/10 bg-gray-100">
                {sceneImageUrl ? (
                  <Image
                    src={sceneImageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={sceneImageUrl.startsWith("http")}
                  />
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
                    if (f) void presignAndUpload(f, "image", "scene");
                  }}
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                />
                <label className="block text-xs font-medium text-[#0d2137]/70">Bild-URL</label>
                <input
                  type="text"
                  value={sceneImageUrl}
                  onChange={(e) => setSceneImageUrl(e.target.value)}
                  onBlur={() => setSceneImageUrl(normalizeWhyAssetUrl(sceneImageUrl))}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  placeholder="https://… oder /images/van2.png"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0d2137]">Video</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">
              YouTube/Vimeo-Link oder direkte .mp4/.webm-URL. Datei-Upload: max. 200 MB, direkt zu Supabase. Leer = nur
              Poster mit Play-Dekoration.
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
                  if (f) void presignAndUpload(f, "video", "video");
                }}
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#0d2137] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
              />
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
