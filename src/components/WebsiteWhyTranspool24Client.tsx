"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { locales, type Locale } from "@/i18n/routing";
import { localeCmsSelectLabel } from "@/lib/locale-display";
import { parseFetchJson } from "@/lib/parse-fetch-json";
import { cmsFetch } from "@/lib/website-cms-fetch";

export function WebsiteWhyTranspool24Client() {
  const [locale, setLocale] = useState<Locale>("ar");
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
      const res = await cmsFetch(`/api/website/content/why-transpool24?locale=${locale}`);
      const data = await parseFetchJson<{ payload?: unknown; error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "فشل التحميل");
      setJsonText(JSON.stringify(data.payload, null, 2));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "فشل التحميل");
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
      setMessage("JSON غير صالح — راجع الصيغة.");
      return;
    }
    if (
      applyToAllLocales &&
      !confirm(
        "ستحصل كل اللغات على نفس هذا الـ JSON — أي أن العناوين ونصوص الأسئلة ستكون متطابقة في كل المواقع (مثلاً ألماني على /ar/why).\n\n" +
          "للصور والفيديو استخدم صفحة «الوسائط» مع خيار «تطبيق على كل اللغات».\n\nهل تريد الحفظ رغم ذلك؟"
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const res = await cmsFetch("/api/website/content/why-transpool24", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, payload, applyToAllLocales }),
      });
      const data = await parseFetchJson<{
        error?: string;
        applyToAllLocales?: boolean;
        localesUpdated?: string[];
      }>(res);
      if (!res.ok) throw new Error(data.error || "فشل الحفظ");
      if (data.applyToAllLocales && Array.isArray(data.localesUpdated)) {
        setMessage(`تم الحفظ لكل اللغات (${data.localesUpdated.length}).`);
      } else {
        setMessage("تم الحفظ.");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const resetToCodeDefaults = async () => {
    if (!confirm("حذف سجل قاعدة البيانات لهذه اللغة وتحميل النصوص الافتراضية من الكود؟")) return;
    setMessage(null);
    setSaving(true);
    try {
      const res = await cmsFetch(`/api/website/content/why-transpool24?locale=${locale}`, {
        method: "DELETE",
      });
      const data = await parseFetchJson<{ payload?: unknown; error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "فشل الاستعادة");
      setJsonText(JSON.stringify(data.payload, null, 2));
      setMessage(
        "تمت الاستعادة: حُذف سجل قاعدة البيانات. الصفحة العامة /[locale]/why تستخدم الآن النصوص الافتراضية من الكود — لا حاجة لحفظ جديد.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "فشل الاستعادة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-[#0d2137]">الصفحة الرئيسية – لماذا TransPool24؟</h1>

      <div className="mb-6 flex flex-col gap-3 rounded-xl border-2 border-[var(--accent)] bg-gradient-to-br from-[var(--accent)]/12 to-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="text-sm text-[#0d2137]">
          <p className="font-bold text-[#0d2137]">صور وفيديو صفحة «لماذا»؟</p>
          <p className="mt-1 text-[#0d2137]/85">
            ليست هنا — افتح صفحة <strong>الوسائط</strong> من القائمة الجانبية أو الزر أدناه. هناك: صورة البانوراما، صورة
            المشهد، ورفع الفيديو + خيار <strong>تطبيق على كل اللغات</strong>.
          </p>
        </div>
        <Link
          href="/website/why-media"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-center text-sm font-bold text-white shadow-md transition hover:opacity-95"
        >
          صور وفيديو
        </Link>
      </div>

      <p className="mb-6 text-sm text-[#0d2137]/70">
        محتوى صفحة{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">/[locale]/why</code> — عدّل JSON ثم احفظ. السجلات المحفوظة في{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">why_transpool24_locale</code>{" "}
        <strong>تستبدل</strong> نصوص الكود (
        <code className="rounded bg-[#0d2137]/5 px-1">src/lib/why-defaults-*.ts</code>
        ). إذا ظهرت نصوص قديمة على الموقع: اختر اللغة ثم <strong>النصوص الافتراضية</strong> لحذف سجل القاعدة واستخدام
        النصوص الحالية. كذلك يُتجاهل JSON المحفوظ بدون{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">contentRevision</code> أحدث من الكود — وتعرض الصفحة النصوص الافتراضية.
      </p>
      <div
        className="mb-6 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-3 text-sm text-[#0d2137]"
      >
        <p className="mb-2 font-semibold text-[#0d2137]">لماذا قائمة «اللغة»؟</p>
        <p className="mb-2 text-[#0d2137]/85">
          محتوى JSON يحتوي عناوين ونصوصاً <strong>مترجمة لكل لغة</strong> (عربي، ألماني، …). تختار اللغة لتحميل وتحرير{" "}
          <strong>نسخة تلك اللغة</strong> ثم تحفظ عادةً <strong>لهذه اللغة فقط</strong>.
        </p>
        <p className="text-[#0d2137]/85">
          لتغيير <strong>الصور والفيديو</strong>:{" "}
          <Link href="/website/why-media" className="font-bold text-[var(--accent)] underline underline-offset-2">
            انتقل إلى صفحة الوسائط
          </Link>{" "}
          وفعّل <strong>«تطبيق على كل اللغات»</strong> عند الحفظ.
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={applyToAllLocales}
            onChange={(e) => setApplyToAllLocales(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[#0d2137]/30 text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <span className="text-sm text-[#0d2137]">
            <strong className="font-semibold">حفظ هذا الـ JSON لكل اللغات ({locales.length})</strong>
            <span className="mt-1 block text-[#0d2137]/75">
              مفيد فقط إذا أردت نفس النصوص في كل اللغات. وإلا احفظ لكل لغة على حدة أو استخدم صفحة الوسائط.
            </span>
          </span>
        </label>
      </div>

      <p className="mb-6 rounded-lg border border-[#0d2137]/10 bg-[#0d2137]/[0.03] px-4 py-3 text-sm text-[#0d2137]/75">
        <strong className="text-[#0d2137]">منطقة الإغلاق (دعوة برتقالية + تذييل داكن):</strong> تظهر في نهاية الصفحات العامة مع{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">Footer</code> (الرئيسية، لماذا، الدعم، الطلب، السائق، …). عدّل النصوص في{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">messages/*.json</code> ←{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">infoPageClosing</code>. شعار التذييل (شفاف):{" "}
        <code className="rounded bg-[#0d2137]/5 px-1">public/356.png</code> عبر Git/النشر، وليس من JSON.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-[#0d2137]">اللغة (تحميل / تعديل)</label>
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
          onClick={resetToCodeDefaults}
          disabled={saving}
          className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50 disabled:opacity-50"
        >
          النصوص الافتراضية
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
        >
          {saving ? "جاري الحفظ…" : "حفظ"}
        </button>
      </div>

      {message && (
        <p
          className={`mb-3 text-sm ${
            message.startsWith("تم الحفظ") || message.startsWith("تمت الاستعادة") ? "text-green-700" : "text-red-700"
          }`}
        >
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-[#0d2137]/70">جاري التحميل…</p>
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
