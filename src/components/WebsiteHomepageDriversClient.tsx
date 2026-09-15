"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cmsFetch } from "@/lib/website-cms-fetch";

interface Driver {
  id?: number;
  name: string;
  photo: string;
  rating: number;
  comment: string;
  customerName: string;
  order?: number;
}

type Props = { apiBase: string };

const PHOTO_UPLOAD_URL = "/api/website/content/drivers/upload";
const LOOKUP_BY_NUMBER_URL = "/api/website/content/drivers/lookup-by-number";

export function WebsiteHomepageDriversClient({ apiBase }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [driverNumberQuery, setDriverNumberQuery] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Driver>({
    name: "",
    photo: "",
    rating: 5,
    comment: "",
    customerName: "",
    order: 0,
  });

  useEffect(() => {
    cmsFetch(`${apiBase}`)
      .then((r) => r.json())
      .then((data) => {
        setDrivers(data.drivers || []);
      })
      .catch(() => {
        setDrivers([]);
      })
      .finally(() => setLoading(false));
  }, [apiBase]);

  const handleAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    setDriverNumberQuery("");
    setFormData({
      name: "",
      photo: "",
      rating: 5,
      comment: "",
      customerName: "",
      order: drivers.length,
    });
  };

  const handleEdit = (driver: Driver) => {
    setEditingId(driver.id ?? null);
    setFormData(driver);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذا السائق؟")) return;
    setSaving(true);
    try {
      const res = await cmsFetch(`${apiBase}/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDrivers(drivers.filter((d) => d.id !== id));
      } else {
        alert("فشل الحذف.");
      }
    } catch {
      alert("فشل الطلب.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${apiBase}/${editingId}` : apiBase;
      const res = await cmsFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        if (editingId) {
          setDrivers(drivers.map((d) => (d.id === editingId ? data.driver : d)));
        } else {
          setDrivers([...drivers, data.driver]);
        }
        setEditingId(null);
        setIsAdding(false);
        setDriverNumberQuery("");
        setFormData({
          name: "",
          photo: "",
          rating: 5,
          comment: "",
          customerName: "",
          order: drivers.length,
        });
        alert("تم الحفظ.");
      } else {
        const errBody = await res.json().catch(() => ({}));
        const msg =
          typeof (errBody as { error?: string }).error === "string"
            ? (errBody as { error: string }).error
            : "فشل الحفظ.";
        alert(msg);
      }
    } catch {
      alert("فشل الطلب.");
    } finally {
      setSaving(false);
    }
  };

  const handleLookupByDriverNumber = async () => {
    const num = parseInt(driverNumberQuery.trim(), 10);
    if (!Number.isFinite(num) || num < 1) {
      alert("أدخل رقم سائق صحيح.");
      return;
    }
    setLookupLoading(true);
    try {
      const res = await cmsFetch(LOOKUP_BY_NUMBER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverNumber: num }),
      });
      const data = (await res.json()) as { photoUrl?: string; fullName?: string; error?: string };
      if (res.status === 401) {
        alert("غير مسجّل الدخول — سجّل الدخول من /website/login.");
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "فشل البحث.");
      }
      if (!data.photoUrl) throw new Error("لا توجد صورة.");
      setFormData((prev) => ({
        ...prev,
        photo: data.photoUrl!,
        name: prev.name.trim() ? prev.name : data.fullName?.trim() || prev.name,
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "فشل البحث.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("يرجى اختيار صورة (JPEG أو PNG أو WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("الملف أكبر من الحد المسموح (5 ميغابايت كحد أقصى).");
      return;
    }
    setPhotoUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const res = await cmsFetch(PHOTO_UPLOAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: dataUrl, filename: file.name }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "فشل الرفع.");
      if (data.url) setFormData((prev) => ({ ...prev, photo: data.url! }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "فشل الرفع.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleReorder = async (id: number, direction: "up" | "down") => {
    const index = drivers.findIndex((d) => d.id === id);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= drivers.length) return;

    const newDrivers = [...drivers];
    [newDrivers[index], newDrivers[newIndex]] = [newDrivers[newIndex], newDrivers[index]];
    newDrivers.forEach((d, i) => {
      d.order = i;
    });
    setDrivers(newDrivers);

    try {
      await cmsFetch(`${apiBase}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drivers: newDrivers.map((d) => ({ id: d.id, order: d.order })) }),
      });
    } catch {
      // Silent fail
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0d2137]">الصفحة الرئيسية – تقييمات السائقين</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#0d2137]/70">
            تُحفظ البطاقات في قاعدة البيانات وتظهر في شريط التقييمات على الصفحة الرئيسية. يمكنك إضافة أي عدد وترتيبها
            بالأسهم. بعد الحفظ حدّث صفحة الموقع لرؤية التحديث فوراً.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:opacity-95 sm:self-start"
        >
          + سائق جديد
        </button>
      </div>

      {(editingId !== null || isAdding) && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-[#0d2137]">
            {editingId ? "تعديل السائق" : "سائق جديد"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">الاسم</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div className="sm:col-span-2 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
              <label className="mb-2 block text-sm font-medium text-[#0d2137]/85">رقم السائق</label>
              <p className="mb-2 text-xs text-[#0d2137]/65">
                للسائقين المعتمدين: يمكن جلب الصورة الشخصية من الطلب دون رفع ملف.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={driverNumberQuery}
                  onChange={(e) => setDriverNumberQuery(e.target.value)}
                  placeholder="مثال: 10002"
                  disabled={lookupLoading || photoUploading}
                  className="w-36 rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => void handleLookupByDriverNumber()}
                  disabled={lookupLoading || photoUploading}
                  className="rounded-lg bg-[#0d2137] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
                >
                  {lookupLoading ? "…" : "تحميل الصورة"}
                </button>
              </div>
              <p className="mt-2 text-xs text-[#0d2137]/55">
                فقط سائق معتمد ولديه صورة شخصية في طلب التسجيل.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">الصورة (يدوياً)</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[var(--accent)]/30 bg-gray-100">
                  {formData.photo ? (
                    <Image
                      src={formData.photo}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(ev) => {
                        (ev.target as HTMLImageElement).src =
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || "?")}&background=e85d04&color=fff&size=128`;
                      }}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs text-[#0d2137]/40">
                      —
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoFile}
                    disabled={photoUploading}
                    className="block w-full text-sm text-[#0d2137] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-95 disabled:opacity-50"
                  />
                  <p className="text-xs text-[#0d2137]/60">
                    ارفع صورة من جهازك (JPEG/PNG/WebP، حد أقصى 5 ميغابايت). تُحفظ في التخزين وتُستخدم كرابط عام.
                  </p>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#0d2137]/70">
                      رابط الصورة (اختياري بدل الرفع)
                    </label>
                    <input
                      type="url"
                      value={formData.photo}
                      onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                      placeholder="https://… (يفضّل الرفع بدل الروابط الخارجية)"
                      className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  {photoUploading && <p className="text-sm text-[var(--accent)]">جاري الرفع…</p>}
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">التقييم (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value, 10) || 5 })}
                required
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">اسم العميل</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">التعليق</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                required
                rows={3}
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "جاري الحفظ…" : "حفظ"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setIsAdding(false);
                setDriverNumberQuery("");
                setFormData({
                  name: "",
                  photo: "",
                  rating: 5,
                  comment: "",
                  customerName: "",
                  order: drivers.length,
                });
              }}
              className="rounded-lg border border-[#0d2137]/20 px-4 py-2 font-medium text-[#0d2137] hover:bg-[#0d2137]/5"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {drivers.length === 0 ? (
          <div className="rounded-xl border border-[#0d2137]/10 bg-white p-8 text-center text-[#0d2137]/60">
            <p>لا يوجد سائقون بعد.</p>
            <button
              type="button"
              onClick={handleAdd}
              className="mt-4 text-[var(--accent)] hover:underline"
            >
              إضافة أول سائق
            </button>
          </div>
        ) : (
          drivers
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((driver, index) => (
              <div
                key={driver.id || index}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-[#0d2137]/10 bg-white p-4 shadow-sm"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[var(--accent)]/20">
                  <Image
                    src={
                      driver.photo ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=e85d04&color=fff&size=128`
                    }
                    alt={driver.name}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(ev) => {
                      (ev.target as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=e85d04&color=fff&size=128`;
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[#0d2137]">{driver.name}</h3>
                  <p className="text-sm text-[#0d2137]/70">
                    {driver.rating} ⭐ · {driver.customerName}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm italic text-[#0d2137]/60">&quot;{driver.comment}&quot;</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => driver.id != null && handleReorder(driver.id, "up")}
                    disabled={index === 0}
                    className="rounded-lg border border-[#0d2137]/20 p-2 hover:bg-[#0d2137]/5 disabled:opacity-30"
                    title="للأعلى"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => driver.id != null && handleReorder(driver.id, "down")}
                    disabled={index === drivers.length - 1}
                    className="rounded-lg border border-[#0d2137]/20 p-2 hover:bg-[#0d2137]/5 disabled:opacity-30"
                    title="للأسفل"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(driver)}
                    className="rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm font-medium text-[#0d2137] hover:bg-[#0d2137]/5"
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => driver.id != null && handleDelete(driver.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
