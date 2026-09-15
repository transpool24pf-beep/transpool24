"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { WebsiteHeroImageEditor } from "@/components/WebsiteHeroImageEditor";
import { cmsFetch } from "@/lib/website-cms-fetch";
import { WEBSITE_CMS_LOCALE_OPTIONS } from "@/lib/website-cms-locales";

type HeroData = {
  imageUrl: string | null;
  truckImageUrl: string | null;
  headline: Record<string, string>;
  subtitle: Record<string, string>;
  cta: Record<string, string>;
};

type EnglishFields = { headline: string; subtitle: string; cta: string };

const UPLOAD_URL = "/api/website/content/hero/upload";
const PROXY_URL = "/api/website/content/hero/proxy-image";
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
    truckImageUrl: null,
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
  const [truckUploading, setTruckUploading] = useState(false);

  const load = () =>
    cmsFetch(API_BASE)
      .then((r) => r.json())
      .then((res) => {
        const next: HeroData = {
          imageUrl: res.imageUrl ?? null,
          truckImageUrl: res.truckImageUrl ?? null,
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
      alert("يرجى اختيار صورة (JPEG أو PNG أو WebP).");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      alert("الملف أكبر من الحد المسموح (12 ميغابايت كحد أقصى).");
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
      const res = await cmsFetch(UPLOAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: dataUrl, filename: file.name }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (res.status === 401) {
        throw new Error(
          "انتهت الجلسة — سجّل الدخول من جديد من /website/login.",
        );
      }
      if (!res.ok) throw new Error(body.error || "فشل الرفع.");
      if (body.url) setData((prev) => ({ ...prev, imageUrl: body.url! }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "فشل الرفع.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleTruckFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("يرجى اختيار صورة (JPEG أو PNG أو WebP).");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      alert("الملف أكبر من الحد المسموح (12 ميغابايت كحد أقصى).");
      return;
    }
    setTruckUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const res = await cmsFetch(UPLOAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: dataUrl, filename: file.name }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (res.status === 401) {
        throw new Error(
          "انتهت الجلسة — سجّل الدخول من جديد من /website/login.",
        );
      }
      if (!res.ok) throw new Error(body.error || "فشل الرفع.");
      if (body.url) setData((prev) => ({ ...prev, truckImageUrl: body.url! }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "فشل الرفع.");
    } finally {
      setTruckUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await cmsFetch(API_BASE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: data.imageUrl,
          truckImageUrl: data.truckImageUrl,
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
          "تم الحفظ. الصفحة الرئيسية والمجلة (/blog) تقرآن بيانات البطل مباشرة من قاعدة البيانات.";
        if (body.translationFallback) {
          msg +=
            "\n\nملاحظة: بدون مفتاح DeepL أو Google Translate تُستخدم خدمة محدودة. يُفضّل DeepL للترجمة المستقرة.";
        }
        alert(msg);
      } else if (res.status === 401) {
        alert(
          "انتهت الجلسة — سجّل الدخول من جديد من /website/login",
        );
      } else {
        alert(body.error || "فشل الحفظ.");
      }
    } catch {
      alert("فشل الطلب.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <p className="text-[#0d2137]/70">جاري التحميل…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0d2137]">البطل – الصفحة الرئيسية والمجلة</h1>
        <p className="mt-1 text-sm text-[#0d2137]/70">
          <strong className="text-[#0d2137]">الصفحة الرئيسية:</strong> قسم البطل الكلاسيكي (هذه الصورة والنصوص).{" "}
          <strong className="ms-1 text-[#0d2137]">المجلة (/blog):</strong> غلاف لوجستي كبير مع شاحنة في المقدمة يستخدم نفس البيانات. أدخل النصوص بالإنجليزية؛ تُترجم تلقائياً عند الحفظ.
        </p>
        <p className="mt-2 text-sm font-medium text-[#0d2137]">
          الشاحنة تظهر على <strong>صفحة المجلة فقط</strong> — يُفضّل ملف PNG شفاف.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-[#0d2137]">المجلة: شاحنة البطل (متداخلة)</h2>
          <p className="mb-4 text-sm text-[#0d2137]/65">
            تظهر فقط على <strong>صفحة المجلة</strong> (مثل /ar/blog) أسفل اليمين. بدون صورة يُستخدم الافتراضي.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative h-40 w-full max-w-xs shrink-0 overflow-hidden rounded-xl border-2 border-[#0d2137]/10 bg-gray-100">
              {data.truckImageUrl ? (
                <Image
                  key={data.truckImageUrl}
                  src={data.truckImageUrl}
                  alt=""
                  fill
                  className="object-contain object-center p-2"
                  unoptimized={data.truckImageUrl.startsWith("http")}
                  sizes="300px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-[#0d2137]/45">
                  شاحنة افتراضية (إن تُرك فارغاً)
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleTruckFile}
                disabled={truckUploading}
                className="block w-full text-sm text-[#0d2137] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0d2137]/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#0d2137] hover:file:opacity-90 disabled:opacity-50"
              />
              <input
                type="url"
                placeholder="أو رابط صورة الشاحنة"
                value={data.truckImageUrl ?? ""}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, truckImageUrl: e.target.value.trim() || null }))
                }
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <button
                type="button"
                className="text-xs font-medium text-red-700 underline"
                onClick={() => setData((prev) => ({ ...prev, truckImageUrl: null }))}
              >
                إعادة صورة الشاحنة للافتراضي
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-[#0d2137]">صورة الخلفية (الصفحة الرئيسية وغلاف المجلة)</h2>
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
                  لا توجد صورة — سيُستخدم الافتراضي
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
                JPEG/PNG/WebP، حد أقصى 12 ميغابايت — يُفضَّل عرض عالٍ (مثلاً 2400 بكسل فأكثر) وبأقل ضغط. بعد الرفع اضغط «حفظ».
              </p>
              <input
                type="url"
                placeholder="أو ألصق رابطاً (حفظ مباشر بدون المحرّر)"
                value={data.imageUrl ?? ""}
                onChange={(e) => setData((prev) => ({ ...prev, imageUrl: e.target.value.trim() || null }))}
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="mt-6">
            <WebsiteHeroImageEditor
              uploadEndpoint={UPLOAD_URL}
              proxyEndpoint={PROXY_URL}
              initialUrl={data.imageUrl}
              disabled={imageUploading}
              onBusyChange={setImageUploading}
              onUploaded={(url) => setData((prev) => ({ ...prev, imageUrl: url }))}
            />
            <p className="mt-2 text-xs text-[#0d2137]/55">
              المحرّر: رابط أو ملف، ثم مقياس ودوران وقلب، ثم «تطبيق التحويل ورفع الصورة»، ثم احفظ الصفحة.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-medium text-[#0d2137]">نصوص البطل (بالإنجليزية فقط)</h2>
          <p className="mb-6 text-sm text-[#0d2137]/65">
            اتركها فارغة لاستخدام الترجمات الافتراضية من ملفات اللغات على الموقع.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#0d2137]/70">العنوان (إنجليزي)</label>
              <input
                type="text"
                value={english.headline}
                onChange={(e) => setEnglish((p) => ({ ...p, headline: e.target.value }))}
                placeholder="e.g. Your logistics partner in Pforzheim"
                className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#0d2137]/70">العنوان الفرعي (إنجليزي)</label>
              <input
                type="text"
                value={english.subtitle}
                onChange={(e) => setEnglish((p) => ({ ...p, subtitle: e.target.value }))}
                placeholder="e.g. Fast, reliable, transparent."
                className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#0d2137]/70">الزر (إنجليزي)</label>
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
              كل اللغات (معاينة بعد الحفظ)
            </summary>
            <p className="mt-2 text-xs text-[#0d2137]/60">
              معاينة لكل لغة بعد الحفظ
            </p>
            <div className="mt-4 space-y-4">
              {WEBSITE_CMS_LOCALE_OPTIONS.map(({ code, label }) => (
                <div key={code} className="rounded-md border border-[#0d2137]/8 bg-white p-3 text-xs">
                  <p className="mb-2 font-semibold text-[#0d2137]">
                    {label} ({code})
                  </p>
                  <p>
                    <span className="text-[#0d2137]/55">العنوان: </span>
                    {data.headline[code] || "—"}
                  </p>
                  <p className="mt-1">
                    <span className="text-[#0d2137]/55">العنوان الفرعي: </span>
                    {data.subtitle[code] || "—"}
                  </p>
                  <p className="mt-1">
                    <span className="text-[#0d2137]/55">الزر: </span>
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
          {saving ? "جاري الحفظ والترجمة…" : "حفظ وترجمة كل اللغات"}
        </button>
      </form>
    </div>
  );
}
