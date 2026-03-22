/**
 * Persists driver application wizard across locale changes and browser sessions (localStorage).
 */

export const DRIVER_WIZARD_STORAGE_KEY = "transpool24-driver-wizard-v1";

export type DriverWizardFormSnapshot = {
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

export const initialDriverWizardForm = (): DriverWizardFormSnapshot => ({
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
});

type DraftFile = {
  /** v2: 3 wizard steps (personal+vehicle merged in step 2). v1: legacy 4-step wizard */
  v: 1 | 2;
  step: number;
  form: Partial<DriverWizardFormSnapshot>;
};

export function parseDriverWizardDraft(): DraftFile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRIVER_WIZARD_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as DraftFile;
    if (typeof data.step !== "number") return null;
    const ver: 1 | 2 = data.v === 2 ? 2 : 1;
    return { v: ver, step: data.step, form: data.form ?? {} };
  } catch {
    return null;
  }
}

/** Auto-open the form section if user had started the wizard (any locale). */
export function shouldOpenDriverFormFromDraft(): boolean {
  const d = parseDriverWizardDraft();
  if (!d) return false;
  if (d.step >= 2) return true; // v1 or v2: step 2+ means progress
  const f = d.form;
  if (!f) return false;
  return Boolean(
    (f.city && String(f.city).trim()) ||
      (f.fullName && String(f.fullName).trim()) ||
      (f.email && String(f.email).trim()) ||
      (f.phone && String(f.phone).trim()) ||
      f.servicePolicyAccepted
  );
}

export function mergeDriverWizardForm(
  saved: Partial<DriverWizardFormSnapshot> | undefined,
  initialCity: string
): DriverWizardFormSnapshot {
  const base = { ...initialDriverWizardForm(), city: initialCity || "" };
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    city: saved.city != null && String(saved.city).trim() !== "" ? saved.city : base.city,
    servicePolicyAccepted: Boolean(saved.servicePolicyAccepted),
    workPolicyAccepted: Boolean(saved.workPolicyAccepted),
    phoneCountryCode:
      saved.phoneCountryCode != null && String(saved.phoneCountryCode).trim() !== ""
        ? saved.phoneCountryCode
        : base.phoneCountryCode,
  };
}

export function saveDriverWizardDraft(step: number, form: DriverWizardFormSnapshot) {
  if (typeof window === "undefined") return;
  try {
    if (step >= 4) {
      localStorage.removeItem(DRIVER_WIZARD_STORAGE_KEY);
      return;
    }
    const payload: DraftFile = { v: 2, step, form };
    localStorage.setItem(DRIVER_WIZARD_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearDriverWizardDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRIVER_WIZARD_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Whether the draft is worth keeping (avoid storing an empty step-1). */
export function driverWizardHasProgress(form: DriverWizardFormSnapshot, step: number): boolean {
  if (step >= 2) return true;
  return Boolean(
    form.city.trim() ||
      form.fullName.trim() ||
      form.email.trim() ||
      form.phone.trim() ||
      form.servicePolicyAccepted
  );
}
