"use client";

import { useState } from "react";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  license: string;
  vehicleType: string;
  availability: string;
  experience: string;
  note: string;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  license: "",
  vehicleType: "",
  availability: "",
  experience: "",
  note: "",
};

export function DriverApplicationForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/driver-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to submit");
      setDone(true);
      setForm(initialState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof FormState, value: string) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#0d2137]/10 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#0d2137]">الاسم الكامل</span>
          <input className="w-full rounded-lg border border-[#0d2137]/15 px-3 py-2" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#0d2137]">البريد الإلكتروني</span>
          <input type="email" className="w-full rounded-lg border border-[#0d2137]/15 px-3 py-2" required value={form.email} onChange={(e) => update("email", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#0d2137]">رقم الهاتف</span>
          <input className="w-full rounded-lg border border-[#0d2137]/15 px-3 py-2" required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#0d2137]">المدينة</span>
          <input className="w-full rounded-lg border border-[#0d2137]/15 px-3 py-2" required value={form.city} onChange={(e) => update("city", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#0d2137]">رخصة القيادة</span>
          <input className="w-full rounded-lg border border-[#0d2137]/15 px-3 py-2" required value={form.license} onChange={(e) => update("license", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#0d2137]">نوع المركبة</span>
          <input className="w-full rounded-lg border border-[#0d2137]/15 px-3 py-2" placeholder="Van / Truck / Car" required value={form.vehicleType} onChange={(e) => update("vehicleType", e.target.value)} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#0d2137]">التوفر</span>
          <input className="w-full rounded-lg border border-[#0d2137]/15 px-3 py-2" placeholder="Full-time / Part-time" required value={form.availability} onChange={(e) => update("availability", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#0d2137]">الخبرة</span>
          <input className="w-full rounded-lg border border-[#0d2137]/15 px-3 py-2" value={form.experience} onChange={(e) => update("experience", e.target.value)} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-[#0d2137]">ملاحظات</span>
        <textarea className="min-h-[110px] w-full rounded-lg border border-[#0d2137]/15 px-3 py-2" value={form.note} onChange={(e) => update("note", e.target.value)} />
      </label>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {done && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">تم استلام طلبك بنجاح، وسنتواصل معك قريباً.</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "جاري الإرسال…" : "إرسال طلب العمل"}
      </button>
    </form>
  );
}
