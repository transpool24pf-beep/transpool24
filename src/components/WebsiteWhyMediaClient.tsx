"use client";

import { useCallback, useEffect, useState } from "react";
import { locales, type Locale } from "@/i18n/routing";
import { localeCmsSelectLabel } from "@/lib/locale-display";
import { parseFetchJson } from "@/lib/parse-fetch-json";
import { cmsFetch } from "@/lib/website-cms-fetch";
import { putFileToSupabaseSignedUrl } from "@/lib/upload-supabase-signed-url";
import { normalizeWhyAssetUrl } from "@/lib/why-asset-url";
import { WhyCmsImage } from "@/components/why-transpool24/WhyCmsImage";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

type PresignOk = { signedUrl: string; publicUrl: string; error?: string };

export function WebsiteWhyMediaClient() {
  const [locale, setLocale] = useState<Locale>("ar");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [sceneImageUrl, setSceneImageUrl] = useState("");
  const [howVideoUrl, setHowVideoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"hero" | "scene" | "video" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  /** Same hero/scene/video URLs for every locale (DE, EN, AR, …) */
  const [applyToAllLocales, setApplyToAllLocales] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await cmsFetch(`/api/website/content/why-transpool24?locale=${locale}`);
      const data = await parseFetchJson<{ payload?: { heroImageUrl?: string; sceneImageUrl?: string; howVideoUrl?: string }; error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "فشل التحميل");
      setHeroImageUrl(normalizeWhyAssetUrl(data.payload?.heroImageUrl || ""));
      setSceneImageUrl(normalizeWhyAssetUrl(data.payload?.sceneImageUrl || ""));
      setHowVideoUrl((data.payload?.howVideoUrl || "").trim());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  const presignAndUpload = async (file: File, kind: "image" | "video", slot: "hero" | "scene" | "video") => {
    if (kind === "image" && file.size > MAX_IMAGE_BYTES) {
      alert(`الصورة بحد أقصى ${MAX_IMAGE_BYTES / (1024 * 1024)} ميغابايت.`);
      return;
    }
    if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
      alert(`الفيديو بحد أقصى ${MAX_VIDEO_BYTES / (1024 * 1024)} ميغابايت.`);
      return;
    }

    setUploading(slot);
    setMessage(null);
    try {
      const pres = await cmsFetch("/api/website/content/why-transpool24/presign-upload", {
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
      if (!pres.ok || !j.signedUrl) throw new Error(j.error || "فشل تجهيز الرفع");
      await putFileToSupabaseSignedUrl(j.signedUrl, file, true);
      const pub = j.publicUrl;
      if (!pub) throw new Error("لم يُرجع رابط عام.");
      if (slot === "hero") setHeroImageUrl(pub);
      else if (slot === "scene") setSceneImageUrl(pub);
      else setHowVideoUrl(pub);
      setMessage("اكتمل الرفع, اضغط «حفظ الوسائط» حتى تُحفظ الروابط في قاعدة البيانات.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await cmsFetch("/api/website/content/why-transpool24", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          applyToAllLocales,
          heroImageUrl: normalizeWhyAssetUrl(heroImageUrl),
          sceneImageUrl: normalizeWhyAssetUrl(sceneImageUrl),
          howVideoUrl: howVideoUrl.trim(),
        }),
      });
      const data = await parseFetchJson<{
        error?: string;
        applyToAllLocales?: boolean;
        localesUpdated?: string[];
      }>(res);
      if (!res.ok) throw new Error(data.error || "فشل الحفظ");
      if (data.applyToAllLocales && Array.isArray(data.localesUpdated)) {
        setMessage(
          `تم الحفظ لكل اللغات (${data.localesUpdated.length}), مثل /de/why و /en/why و /ar/why. روابط الوسائط أصبحت متطابقة.`
        );
      } else {
        setMessage(`تم الحفظ. صفحة /${locale}/why تقرأ المحتوى مباشرة من قاعدة البيانات.`);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-[#0d2137]">الصفحة الرئيسية – الوسائط (صفحة لماذا)</h1>
      <p className="mb-6 text-sm text-[#0d2137]/70">
        الرفع يتم <strong>مباشرة إلى التخزين</strong> (رابط موقّع) لتجاوز حد حجم الملفات على Vercel.
        شكل الرابط العام:{" "}
        <code className="rounded bg-[#0d2137]/5 px-1 break-all">
          …/object/public/driver-documents/why-page-media/…
        </code>{" "}
        (الحاوية <code className="rounded bg-[#0d2137]/5 px-1">driver-documents</code> وليس{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">media/…</code>). الصور المحلية:{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">/images/…</code> وليس{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">./images/…</code>. مسار الحفظ:{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">why-page-media/{`{locale}`}/</code> داخل الحاوية{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">driver-documents</code>.
      </p>

      <div className="mb-4 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/5 px-4 py-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={applyToAllLocales}
            onChange={(e) => setApplyToAllLocales(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[#0d2137]/30 text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <span className="text-sm text-[#0d2137]">
            <strong className="font-semibold">تطبيق على كل اللغات</strong>
            <span className="mt-1 block text-[#0d2137]/75">
              عند التفعيل: عند الحفظ تحصل <strong>كل اللغات ({locales.length})</strong> على نفس روابط الصور والفيديو
              (المعاينة هنا تبقى حسب اللغة المختارة).
            </span>
            <span className="mt-2 block text-xs text-amber-900/90" dir="rtl">
              إذا ظهر خطأ عند الحفظ: قد تحتاج قاعدة البيانات إلى توسيع قائمة اللغات, نفّذ ملف SQL{" "}
              <code className="rounded bg-white/80 px-1">supabase/FIX_why_save_all_languages.sql</code> في Supabase →
              SQL Editor.
            </span>
          </span>
        </label>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-[#0d2137]">اللغة (معاينة / تعديل)</label>
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
          إعادة التحميل
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
        >
          {saving ? "جاري الحفظ…" : "حفظ الوسائط"}
        </button>
      </div>

      {message && (
        <p
          className={`mb-4 text-sm ${
            message.startsWith("تم الحفظ") || message.startsWith("اكتمل الرفع") ? "text-green-700" : "text-red-700"
          }`}
        >
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-[#0d2137]/70">جاري التحميل…</p>
      ) : (
        <div className="space-y-8">
          <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0d2137]">الصورة الكبيرة (فوق الأسئلة)</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">بانوراما عريضة, يُفضَّل 21:9 أو ما يقاربها. حد أقصى 15 ميغابايت.</p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative h-32 w-full max-w-md overflow-hidden rounded-lg border border-[#0d2137]/10 bg-gray-100 sm:h-36">
                {heroImageUrl ? (
                  <WhyCmsImage src={heroImageUrl} alt="" fill className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm text-[#0d2137]/40">لا توجد صورة</span>
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
                <label className="block text-xs font-medium text-[#0d2137]/70">رابط الصورة</label>
                <input
                  type="text"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  onBlur={() => setHeroImageUrl(normalizeWhyAssetUrl(heroImageUrl))}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  placeholder="https://… أو /images/van1.png"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0d2137]">صورة المشهد («كيف يعمل»)</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">
              صورة المعاينة؛ مع يوتيوب/فيميو يفتح زر التشغيل الفيديو المضمّن. حد أقصى 15 ميغابايت.
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-lg border border-[#0d2137]/10 bg-gray-100">
                {sceneImageUrl ? (
                  <WhyCmsImage src={sceneImageUrl} alt="" fill className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm text-[#0d2137]/40">لا توجد صورة</span>
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
                <label className="block text-xs font-medium text-[#0d2137]/70">رابط الصورة</label>
                <input
                  type="text"
                  value={sceneImageUrl}
                  onChange={(e) => setSceneImageUrl(e.target.value)}
                  onBlur={() => setSceneImageUrl(normalizeWhyAssetUrl(sceneImageUrl))}
                  className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm"
                  placeholder="https://… أو /images/van2.png"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0d2137]">الفيديو</h2>
            <p className="mt-1 text-sm text-[#0d2137]/65">
              رابط يوتيوب/فيميو أو ملف .mp4/.webm مباشر. رفع الملف: حد أقصى 200 ميغابايت إلى التخزين. فارغ = الملصق فقط مع زر تشغيل شكلي.
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
              مسح رابط الفيديو
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
