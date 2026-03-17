"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  DRIVER_COUNTRY_CODES,
  SERVICE_POLICY_TEXT,
  WORK_POLICY_TITLE,
  WORK_POLICY_TEXT,
} from "@/lib/driver-policy";

const DriverCityMap = dynamic(
  () => import("@/components/DriverCityMap").then((m) => m.DriverCityMap),
  { ssr: false }
);

const CITIES = ["بفورتسهايم", "شتوتغارت", "كارلسروه", "مانهايم", "هايدلبرغ", "أخرى"];
const STEPS = [
  { label: "الخطوة 1" },
  { label: "المعلومات الشخصية" },
  { label: "عربة" },
  { label: "التحقق" },
];

type FormData = {
  city: string;
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  servicePolicyAccepted: boolean;
  idDocumentUrl: string;
  licenseFrontUrl: string;
  licenseBackUrl: string;
  taxOrCommercialNumber: string;
  personalPhotoUrl: string;
  languagesSpoken: string;
  vehiclePlate: string;
  vehicleDocumentsUrl: string;
  vehiclePhotoUrl: string;
  workPolicyAccepted: boolean;
};

const initialForm: FormData = {
  city: "",
  fullName: "",
  email: "",
  phoneCountryCode: "+49",
  phone: "",
  servicePolicyAccepted: false,
  idDocumentUrl: "",
  licenseFrontUrl: "",
  licenseBackUrl: "",
  taxOrCommercialNumber: "",
  personalPhotoUrl: "",
  languagesSpoken: "",
  vehiclePlate: "",
  vehicleDocumentsUrl: "",
  vehiclePhotoUrl: "",
  workPolicyAccepted: false,
};

async function uploadFile(base64: string, filename: string): Promise<string> {
  const res = await fetch("/api/driver-applications/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64, filename }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Upload failed");
  return json.url;
}

function FileUploadBox({
  value,
  onChange,
  label,
  exampleSrc,
  accept = "image/*",
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  exampleSrc?: string;
  accept?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const url = await uploadFile(dataUrl, file.name);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-[#0d2137]/20 bg-[#f8f9fa] p-4">
      <p className="mb-2 text-sm font-medium text-[#0d2137]">{label}</p>
      {exampleSrc && (
        <div className="mb-2 flex justify-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-lg border-2 border-[#0d2137]/15 shadow-sm">
            <Image src={exampleSrc} alt="" fill className="object-cover" />
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
        id={label.replace(/\s/g, "-")}
      />
      {value ? (
        <div className="flex items-center justify-between gap-2">
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded border bg-white">
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-red-600 hover:underline"
          >
            إزالة
          </button>
        </div>
      ) : (
        <label
          htmlFor={label.replace(/\s/g, "-")}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-[#0d2137]/15 bg-white py-4 text-sm text-[#0d2137]/70 hover:bg-[#0d2137]/5"
        >
          {loading ? "جاري الرفع…" : "اختر ملفاً أو اسحب الصورة هنا"}
        </label>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function DriverWizardForm({
  onBack,
  initialCity,
}: {
  onBack: () => void;
  initialCity?: string;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    ...initialForm,
    city: initialCity || "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  const countryCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCity) setForm((f) => ({ ...f, city: initialCity }));
  }, [initialCity]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (countryCodeRef.current && !countryCodeRef.current.contains(e.target as Node)) setCountryCodeOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const update = (k: keyof FormData, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const step1Valid =
    form.city &&
    form.fullName.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.servicePolicyAccepted;

  const step2Valid =
    form.idDocumentUrl &&
    form.licenseFrontUrl &&
    form.licenseBackUrl &&
    form.taxOrCommercialNumber.trim() &&
    form.personalPhotoUrl &&
    form.languagesSpoken.trim();

  const step3Valid =
    form.vehiclePlate.trim() && form.vehicleDocumentsUrl && form.vehiclePhotoUrl;

  const step4Valid = form.workPolicyAccepted;

  const handleSubmit = async () => {
    if (!step4Valid) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/driver-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: `${form.phoneCountryCode}${form.phone.replace(/\D/g, "")}`.replace(/^\+/, "+"),
          city: form.city,
          servicePolicyAccepted: form.servicePolicyAccepted,
          idDocumentUrl: form.idDocumentUrl || null,
          licenseFrontUrl: form.licenseFrontUrl || null,
          licenseBackUrl: form.licenseBackUrl || null,
          taxOrCommercialNumber: form.taxOrCommercialNumber.trim() || null,
          personalPhotoUrl: form.personalPhotoUrl || null,
          languagesSpoken: form.languagesSpoken.trim() || null,
          vehiclePlate: form.vehiclePlate.trim() || null,
          vehicleDocumentsUrl: form.vehicleDocumentsUrl || null,
          vehiclePhotoUrl: form.vehiclePhotoUrl || null,
          workPolicyAccepted: form.workPolicyAccepted,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "فشل الإرسال");
      setStep(5);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "فشل الإرسال");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (step === 5) {
    return (
      <div className="rounded-2xl border border-[#0d2137]/10 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600">✓</div>
        <h2 className="text-2xl font-bold text-[#0d2137]">تم استلام طلبك بنجاح</h2>
        <p className="mt-4 max-w-lg mx-auto text-[#0d2137]/80 leading-relaxed">
          سنراجع ملفك بعناية ونتواصل معك عبر الواتساب أو البريد الإلكتروني في أقرب وقت.
          <br />
          شكراً لثقتك بـ TransPool24.
        </p>
        <p className="mt-6 text-sm font-medium text-[var(--accent)]">TransPool24 – شريكك اللوجستي</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              i + 1 === step ? "bg-[var(--accent)] text-white" : i + 1 < step ? "bg-emerald-100 text-emerald-800" : "bg-[#0d2137]/10 text-[#0d2137]/60"
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Step 1: مدينة + اسم + بريد + واتساب + سياسة الخدمة */}
      {step === 1 && (
        <>
          <h2 className="text-xl font-bold text-[#0d2137]">الخطوة الأولى – البيانات الأساسية</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">مدينة العمل</label>
              <select
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className="w-full rounded-xl border border-[#0d2137]/20 bg-white px-4 py-3"
              >
                <option value="">— اختر المدينة —</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">الاسم الكامل</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="الاسم الكامل"
                className="w-full rounded-xl border border-[#0d2137]/20 px-4 py-3"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">البريد الإلكتروني</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="example@domain.com"
                className="w-full rounded-xl border border-[#0d2137]/20 px-4 py-3"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">رقم الواتساب</label>
              <div className="flex gap-2" ref={countryCodeRef}>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setCountryCodeOpen((o) => !o)}
                    className="flex min-w-[4.5rem] items-center gap-1 rounded-lg border border-[#0d2137]/20 bg-[#0d2137]/5 px-3 py-2 text-sm"
                  >
                    {DRIVER_COUNTRY_CODES.find((c) => c.code === form.phoneCountryCode)?.flag ?? "🇩🇪"} {form.phoneCountryCode} ▾
                  </button>
                  {countryCodeOpen && (
                    <ul className="absolute left-0 top-full z-20 mt-1 max-h-52 w-44 overflow-auto rounded-lg border bg-white py-1 shadow-lg">
                      {DRIVER_COUNTRY_CODES.map((c) => (
                        <li key={c.code}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#0d2137]/10"
                            onMouseDown={() => {
                              update("phoneCountryCode", c.code);
                              setCountryCodeOpen(false);
                            }}
                          >
                            {c.flag} {c.code}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="15123456789"
                  className="min-w-0 flex-1 rounded-xl border border-[#0d2137]/20 px-4 py-3"
                />
              </div>
            </div>
            <div className="rounded-xl border-2 border-[var(--accent)]/30 bg-[#fff8f0] p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.servicePolicyAccepted}
                  onChange={(e) => update("servicePolicyAccepted", e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 rounded border-[#0d2137]/20 text-[var(--accent)]"
                />
                <span className="text-sm text-[#0d2137]">{SERVICE_POLICY_TEXT}</span>
              </label>
            </div>
          </div>
          <div className="mt-6">
            <DriverCityMap />
          </div>
          <div className="mt-8 flex justify-between gap-4">
            <button type="button" onClick={onBack} className="rounded-xl border border-[#0d2137]/20 bg-white px-6 py-3 font-medium text-[#0d2137]">
              رجوع
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="rounded-xl bg-[var(--accent)] px-8 py-3 font-semibold text-white disabled:opacity-50"
            >
              متابعة
            </button>
          </div>
        </>
      )}

      {/* Step 2: المعلومات الشخصية */}
      {step === 2 && (
        <>
          <h2 className="text-xl font-bold text-[#0d2137]">المعلومات الشخصية</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <FileUploadBox
              label="صورة الهوية أو الإقامة القانونية"
              value={form.idDocumentUrl}
              onChange={(url) => update("idDocumentUrl", url)}
            />
            <FileUploadBox
              label="صورة شهادة القيادة – الوجه الأمامي"
              value={form.licenseFrontUrl}
              onChange={(url) => update("licenseFrontUrl", url)}
            />
            <FileUploadBox
              label="صورة شهادة القيادة – الوجه الخلفي"
              value={form.licenseBackUrl}
              onChange={(url) => update("licenseBackUrl", url)}
            />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">الرقم الضريبي أو التجاري</label>
              <input
                type="text"
                value={form.taxOrCommercialNumber}
                onChange={(e) => update("taxOrCommercialNumber", e.target.value)}
                placeholder="إن وجد"
                className="w-full rounded-xl border border-[#0d2137]/20 px-4 py-3"
              />
            </div>
            <div className="sm:col-span-2">
              <FileUploadBox
                label="صورة شخصية بخلفية بيضاء"
                value={form.personalPhotoUrl}
                onChange={(url) => update("personalPhotoUrl", url)}
                exampleSrc="/images/445.png"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">اللغات التي تتحدثها بشكل جيد</label>
              <input
                type="text"
                value={form.languagesSpoken}
                onChange={(e) => update("languagesSpoken", e.target.value)}
                placeholder="مثال: العربية، الألمانية، الإنجليزية"
                className="w-full rounded-xl border border-[#0d2137]/20 px-4 py-3"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-between gap-4">
            <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-[#0d2137]/20 bg-white px-6 py-3 font-medium text-[#0d2137]">
              رجوع
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!step2Valid}
              className="rounded-xl bg-[var(--accent)] px-8 py-3 font-semibold text-white disabled:opacity-50"
            >
              متابعة
            </button>
          </div>
        </>
      )}

      {/* Step 3: عربة */}
      {step === 3 && (
        <>
          <h2 className="text-xl font-bold text-[#0d2137]">عربة</h2>
          <div className="space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">رقم السيارة (لوحة)</label>
              <input
                type="text"
                value={form.vehiclePlate}
                onChange={(e) => update("vehiclePlate", e.target.value)}
                placeholder="مثال: PF-AB 1234"
                className="w-full rounded-xl border border-[#0d2137]/20 px-4 py-3"
              />
            </div>
            <FileUploadBox
              label="أوراق السيارة"
              value={form.vehicleDocumentsUrl}
              onChange={(url) => update("vehicleDocumentsUrl", url)}
              accept="image/*,.pdf"
            />
            <FileUploadBox
              label="صورة السيارة"
              value={form.vehiclePhotoUrl}
              onChange={(url) => update("vehiclePhotoUrl", url)}
              exampleSrc="/images/5677.png"
            />
          </div>
          <div className="mt-8 flex justify-between gap-4">
            <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-[#0d2137]/20 bg-white px-6 py-3 font-medium text-[#0d2137]">
              رجوع
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={!step3Valid}
              className="rounded-xl bg-[var(--accent)] px-8 py-3 font-semibold text-white disabled:opacity-50"
            >
              متابعة
            </button>
          </div>
        </>
      )}

      {/* Step 4: التحقق + سياسة العمل */}
      {step === 4 && (
        <>
          <h2 className="text-xl font-bold text-[#0d2137]">التحقق – مراجعة البيانات والموافقة</h2>
          <div className="rounded-xl border border-[#0d2137]/15 bg-[#f8f9fa] p-4 text-sm">
            <p><strong>الاسم:</strong> {form.fullName}</p>
            <p><strong>البريد:</strong> {form.email}</p>
            <p><strong>الواتساب:</strong> {form.phoneCountryCode} {form.phone}</p>
            <p><strong>المدينة:</strong> {form.city}</p>
            <p><strong>الرقم الضريبي/التجاري:</strong> {form.taxOrCommercialNumber || "—"}</p>
            <p><strong>اللغات:</strong> {form.languagesSpoken || "—"}</p>
            <p><strong>رقم السيارة:</strong> {form.vehiclePlate || "—"}</p>
          </div>
          <div className="rounded-xl border-2 border-[var(--accent)]/40 bg-[#fff8f0] p-4">
            <p className="mb-2 font-semibold text-[#0d2137]">{WORK_POLICY_TITLE}</p>
            <div className="max-h-48 overflow-y-auto rounded bg-white p-3 text-xs text-[#0d2137]/90 whitespace-pre-wrap">
              {WORK_POLICY_TEXT}
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.workPolicyAccepted}
                onChange={(e) => update("workPolicyAccepted", e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 rounded border-[#0d2137]/20 text-[var(--accent)]"
              />
              <span className="text-sm text-[#0d2137]">أوافق على سياسة العمل وسياسة الشركة أعلاه.</span>
            </label>
          </div>
          {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
          <div className="mt-8 flex justify-between gap-4">
            <button type="button" onClick={() => setStep(3)} className="rounded-xl border border-[#0d2137]/20 bg-white px-6 py-3 font-medium text-[#0d2137]">
              رجوع
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!step4Valid || submitLoading}
              className="rounded-xl bg-[var(--accent)] px-8 py-3 font-semibold text-white disabled:opacity-50"
            >
              {submitLoading ? "جاري الإرسال…" : "إرسال الطلب"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
