"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  DRIVER_COUNTRY_CODES,
  WORK_POLICY_TITLE,
  WORK_POLICY_TEXT,
} from "@/lib/driver-policy";
import type { DriverWizardFormSnapshot } from "@/lib/driver-wizard-storage";
import {
  clearDriverWizardDraft,
  driverWizardHasProgress,
  mergeDriverWizardForm,
  parseDriverWizardDraft,
  saveDriverWizardDraft,
} from "@/lib/driver-wizard-storage";

const DriverCityMap = dynamic(
  () => import("@/components/DriverCityMap").then((m) => m.DriverCityMap),
  { ssr: false }
);

const CITIES = ["Pforzheim", "Stuttgart", "Karlsruhe", "Mannheim", "Heidelberg", "Sonstige"];
/** 3 steps: basics → documents + vehicle → review */
const STEP_ICONS = ["📋", "🪪", "✓"];

type FormData = {
  city: string;
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  servicePolicyAccepted: boolean;
  idDocumentFrontUrl: string;
  idDocumentBackUrl: string;
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
  idDocumentFrontUrl: "",
  idDocumentBackUrl: "",
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
  fieldId,
  exampleSrc,
  exampleLabel,
  accept = "image/*",
  chooseFileOrDrag,
  remove,
  uploading,
  uploadFailed,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  /** Stable unique id for file input (avoid duplicate labels across locales) */
  fieldId?: string;
  exampleSrc?: string;
  exampleLabel?: string;
  accept?: string;
  chooseFileOrDrag: string;
  remove: string;
  uploading: string;
  uploadFailed: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputHtmlId = fieldId ?? `upload-${label.replace(/\s/g, "-").slice(0, 40)}`;

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
      setError(err instanceof Error ? err.message : uploadFailed);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-[#0d2137]/20 bg-[#f8f9fa] p-4">
      <p className="mb-2 text-sm font-medium text-[#0d2137]">{label}</p>
      {exampleSrc && (
        <div className="mb-3 flex flex-col items-center">
          {exampleLabel && (
            <span className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
              {exampleLabel}
            </span>
          )}
          <div className="relative h-28 w-28 overflow-hidden rounded-xl border-2 border-[#0d2137]/15 bg-white shadow-md ring-2 ring-[#0d2137]/5">
            <Image src={exampleSrc} alt="" fill className="object-cover" sizes="112px" />
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
        id={inputHtmlId}
      />
      {value ? (
        <div className="flex items-center justify-between gap-2">
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-[#0d2137]/10 bg-white shadow-sm">
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-red-600 hover:underline"
          >
            {remove}
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputHtmlId}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#0d2137]/15 bg-white py-5 text-sm text-[#0d2137]/70 transition hover:border-[var(--accent)]/30 hover:bg-[#0d2137]/5"
        >
          {loading ? uploading : chooseFileOrDrag}
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
  const t = useTranslations("driver");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(() => mergeDriverWizardForm(undefined, initialCity || ""));
  const [draftRestored, setDraftRestored] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  const countryCodeRef = useRef<HTMLDivElement>(null);
  const saveDraftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const d = parseDriverWizardDraft();
    if (d) {
      if (d.step >= 5) {
        clearDriverWizardDraft();
        setStep(1);
      } else if (d.v === 2) {
        setStep(Math.min(3, Math.max(1, d.step)));
        setForm(mergeDriverWizardForm(d.form, initialCity || ""));
      } else {
        let s = d.step;
        if (s === 4) s = 3;
        else if (s === 3) s = 2;
        setStep(Math.min(3, Math.max(1, s)));
        setForm(mergeDriverWizardForm(d.form, initialCity || ""));
      }
    }
    setDraftRestored(true);
    // Intentionally once on mount: draft is shared across locales; re-running would reset edits if initialCity changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialCity) {
      setForm((f) => ({ ...f, city: f.city?.trim() ? f.city : initialCity }));
    }
  }, [initialCity]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (countryCodeRef.current && !countryCodeRef.current.contains(e.target as Node)) setCountryCodeOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!draftRestored) return;
    if (saveDraftTimer.current) clearTimeout(saveDraftTimer.current);
    saveDraftTimer.current = setTimeout(() => {
      if (step >= 4) {
        clearDriverWizardDraft();
        return;
      }
      if (!driverWizardHasProgress(form, step)) {
        clearDriverWizardDraft();
        return;
      }
      saveDriverWizardDraft(step, form);
    }, 400);
    return () => {
      if (saveDraftTimer.current) clearTimeout(saveDraftTimer.current);
    };
  }, [step, form, draftRestored]);

  const update = (k: keyof FormData, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const step1Valid =
    form.city &&
    form.fullName.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.servicePolicyAccepted;

  /** Step 2 = personal documents + vehicle (incl. sample vehicle photo) */
  const personalAndVehicleValid =
    form.idDocumentFrontUrl &&
    form.idDocumentBackUrl &&
    form.licenseFrontUrl &&
    form.licenseBackUrl &&
    form.taxOrCommercialNumber.trim() &&
    form.personalPhotoUrl &&
    form.languagesSpoken.trim() &&
    form.vehiclePlate.trim() &&
    form.vehicleDocumentsUrl &&
    form.vehiclePhotoUrl;

  const reviewStepValid = form.workPolicyAccepted;

  const handleSubmit = async () => {
    if (!reviewStepValid) return;
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
          idDocumentFrontUrl: form.idDocumentFrontUrl || null,
          idDocumentBackUrl: form.idDocumentBackUrl || null,
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
      if (!res.ok) throw new Error(data?.error || "Absenden fehlgeschlagen");
      clearDriverWizardDraft();
      setStep(4);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Absenden fehlgeschlagen");
    } finally {
      setSubmitLoading(false);
    }
  };

  const stepLabels = [
    t("step1Name"),
    `${t("step2Name")} · ${t("step3Name")}`,
    t("step4Name"),
  ];

  if (step === 4) {
    return (
      <div className="rounded-2xl border border-[#0d2137]/10 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600">✓</div>
        <h2 className="text-2xl font-bold text-[#0d2137]">{t("successTitle")}</h2>
        <p className="mt-4 max-w-lg mx-auto text-[#0d2137]/80 leading-relaxed">
          {t("successMessage")}
        </p>
        <p className="mt-6 text-sm font-medium text-[var(--accent)]">{t("successBrand")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Step indicator: icons + names + animated connecting line */}
      <div className="rounded-2xl border-2 border-[#0d2137]/10 bg-white px-4 py-6 shadow-sm">
        <div className="flex items-stretch gap-0">
          {stepLabels.map((name, i) => (
            <div key={i} className="flex flex-1 items-center min-w-0">
              <div className="flex flex-col items-center w-full">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl transition-all duration-300 ${
                    i + 1 === step
                      ? "bg-[var(--accent)] text-white ring-4 ring-[var(--accent)]/30 scale-105"
                      : i + 1 < step
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-[#0d2137]/10 text-[#0d2137]/50"
                  }`}
                >
                  {STEP_ICONS[i]}
                </div>
                <span
                  className={`mt-2 text-center text-xs font-semibold leading-tight min-h-[2rem] flex items-center justify-center ${
                    i + 1 === step ? "text-[#0d2137]" : "text-[#0d2137]/70"
                  }`}
                  style={{ maxWidth: "5.5rem" }}
                >
                  {name}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className="flex flex-1 items-center px-1 sm:px-2 min-w-[1rem]">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0d2137]/15">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-500 ease-out"
                      style={{ width: step > i + 1 ? "100%" : "0%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <>
          <h2 className="text-xl font-bold text-[#0d2137]">{t("step1Title")}</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">{t("city")}</label>
              <select
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className="w-full rounded-xl border border-[#0d2137]/20 bg-white px-4 py-3"
              >
                <option value="">{t("cityPlaceholder")}</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">{t("fullName")}</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder={t("fullNamePlaceholder")}
                className="w-full rounded-xl border border-[#0d2137]/20 px-4 py-3"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">{t("email")}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-xl border border-[#0d2137]/20 px-4 py-3"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">{t("whatsapp")}</label>
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
                  placeholder={t("whatsappPlaceholder")}
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
                <span className="text-sm text-[#0d2137]">{t("servicePolicy")}</span>
              </label>
            </div>
          </div>
          <div className="mt-6">
            <DriverCityMap />
          </div>
          <div className="mt-8 flex justify-between gap-4">
            <button type="button" onClick={onBack} className="rounded-xl border border-[#0d2137]/20 bg-white px-6 py-3 font-medium text-[#0d2137]">
              {t("back")}
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="rounded-xl bg-[var(--accent)] px-8 py-3 font-semibold text-white disabled:opacity-50"
            >
              {t("continue")}
            </button>
          </div>
        </>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <>
          <h2 className="text-xl font-bold text-[#0d2137]">{t("step2Title")}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <FileUploadBox
              fieldId="driver-id-doc-front"
              label={t("idDocumentFront")}
              value={form.idDocumentFrontUrl}
              onChange={(url) => update("idDocumentFrontUrl", url)}
              chooseFileOrDrag={t("chooseFileOrDrag")}
              remove={t("remove")}
              uploading={t("uploading")}
              uploadFailed={t("uploadFailed")}
            />
            <FileUploadBox
              fieldId="driver-id-doc-back"
              label={t("idDocumentBack")}
              value={form.idDocumentBackUrl}
              onChange={(url) => update("idDocumentBackUrl", url)}
              chooseFileOrDrag={t("chooseFileOrDrag")}
              remove={t("remove")}
              uploading={t("uploading")}
              uploadFailed={t("uploadFailed")}
            />
            <FileUploadBox
              fieldId="driver-license-front"
              label={t("licenseFront")}
              value={form.licenseFrontUrl}
              onChange={(url) => update("licenseFrontUrl", url)}
              chooseFileOrDrag={t("chooseFileOrDrag")}
              remove={t("remove")}
              uploading={t("uploading")}
              uploadFailed={t("uploadFailed")}
            />
            <FileUploadBox
              fieldId="driver-license-back"
              label={t("licenseBack")}
              value={form.licenseBackUrl}
              onChange={(url) => update("licenseBackUrl", url)}
              chooseFileOrDrag={t("chooseFileOrDrag")}
              remove={t("remove")}
              uploading={t("uploading")}
              uploadFailed={t("uploadFailed")}
            />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">{t("taxNumber")}</label>
              <input
                type="text"
                value={form.taxOrCommercialNumber}
                onChange={(e) => update("taxOrCommercialNumber", e.target.value)}
                placeholder={t("taxPlaceholder")}
                className="w-full rounded-xl border border-[#0d2137]/20 px-4 py-3"
              />
            </div>
            <div className="sm:col-span-2">
              <FileUploadBox
                fieldId="driver-personal-photo"
                label={t("personalPhoto")}
                value={form.personalPhotoUrl}
                onChange={(url) => update("personalPhotoUrl", url)}
                exampleSrc="/images/445.png"
                exampleLabel={t("examplePhoto")}
                chooseFileOrDrag={t("chooseFileOrDrag")}
                remove={t("remove")}
                uploading={t("uploading")}
                uploadFailed={t("uploadFailed")}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">{t("languagesSpoken")}</label>
              <input
                type="text"
                value={form.languagesSpoken}
                onChange={(e) => update("languagesSpoken", e.target.value)}
                placeholder={t("languagesPlaceholder")}
                className="w-full rounded-xl border border-[#0d2137]/20 px-4 py-3"
              />
            </div>
            <div className="sm:col-span-2 mt-2 border-t border-[#0d2137]/10 pt-6">
              <h3 className="mb-1 text-lg font-semibold text-[#0d2137]">{t("step3Title")}</h3>
              <p className="text-sm text-[#0d2137]/65">{t("vehicleSectionHint")}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#0d2137]">{t("vehiclePlate")}</label>
              <input
                type="text"
                value={form.vehiclePlate}
                onChange={(e) => update("vehiclePlate", e.target.value)}
                placeholder={t("vehiclePlatePlaceholder")}
                className="w-full rounded-xl border border-[#0d2137]/20 px-4 py-3"
              />
            </div>
            <div className="sm:col-span-2">
              <FileUploadBox
                fieldId="driver-vehicle-docs"
                label={t("vehicleDocuments")}
                value={form.vehicleDocumentsUrl}
                onChange={(url) => update("vehicleDocumentsUrl", url)}
                accept="image/*,.pdf"
                chooseFileOrDrag={t("chooseFileOrDrag")}
                remove={t("remove")}
                uploading={t("uploading")}
                uploadFailed={t("uploadFailed")}
              />
            </div>
            <div className="sm:col-span-2">
              <FileUploadBox
                fieldId="driver-vehicle-photo"
                label={t("vehiclePhoto")}
                value={form.vehiclePhotoUrl}
                onChange={(url) => update("vehiclePhotoUrl", url)}
                exampleSrc="/images/5677.png"
                exampleLabel={t("examplePhoto")}
                chooseFileOrDrag={t("chooseFileOrDrag")}
                remove={t("remove")}
                uploading={t("uploading")}
                uploadFailed={t("uploadFailed")}
              />
            </div>
          </div>
          <div className="mt-8 flex justify-between gap-4">
            <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-[#0d2137]/20 bg-white px-6 py-3 font-medium text-[#0d2137]">
              {t("back")}
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!personalAndVehicleValid}
              className="rounded-xl bg-[var(--accent)] px-8 py-3 font-semibold text-white disabled:opacity-50"
            >
              {t("continue")}
            </button>
          </div>
        </>
      )}

      {/* Step 3: review + work policy */}
      {step === 3 && (
        <>
          <h2 className="text-xl font-bold text-[#0d2137]">{t("step4Title")}</h2>
          <div className="rounded-xl border border-[#0d2137]/15 bg-[#f8f9fa] p-4 text-sm">
            <p><strong>{t("reviewName")}:</strong> {form.fullName}</p>
            <p><strong>{t("reviewEmail")}:</strong> {form.email}</p>
            <p><strong>{t("reviewWhatsapp")}:</strong> {form.phoneCountryCode} {form.phone}</p>
            <p><strong>{t("reviewCity")}:</strong> {form.city}</p>
            <p><strong>{t("reviewTax")}:</strong> {form.taxOrCommercialNumber || "—"}</p>
            <p><strong>{t("reviewLanguages")}:</strong> {form.languagesSpoken || "—"}</p>
            <p><strong>{t("reviewVehiclePlate")}:</strong> {form.vehiclePlate || "—"}</p>
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
              <span className="text-sm text-[#0d2137]">{t("workPolicyAgree")}</span>
            </label>
          </div>
          {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
          <div className="mt-8 flex justify-between gap-4">
            <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-[#0d2137]/20 bg-white px-6 py-3 font-medium text-[#0d2137]">
              {t("back")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!reviewStepValid || submitLoading}
              className="rounded-xl bg-[var(--accent)] px-8 py-3 font-semibold text-white disabled:opacity-50"
            >
              {submitLoading ? t("submitting") : t("submit")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
