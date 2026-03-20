"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Driver {
  id?: number;
  name: string;
  photo: string;
  rating: number;
  comment: string;
  customerName: string;
  order?: number; // ترتيب العرض
}

export default function AdminContentPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Driver>({
    name: "",
    photo: "",
    rating: 5,
    comment: "",
    customerName: "",
    order: 0,
  });

  useEffect(() => {
    fetch("/api/admin/content/drivers")
      .then((r) => r.json())
      .then((data) => {
        setDrivers(data.drivers || []);
      })
      .catch(() => {
        // إذا لم تكن هناك بيانات، استخدم البيانات الافتراضية
        setDrivers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = () => {
    setEditingId(null);
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
    setEditingId(driver.id || null);
    setFormData(driver);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Möchten Sie diesen Fahrer wirklich löschen?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/drivers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDrivers(drivers.filter((d) => d.id !== id));
      } else {
        alert("Löschen fehlgeschlagen.");
      }
    } catch {
      alert("Anfrage fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/admin/content/drivers/${editingId}`
        : "/api/admin/content/drivers";
      const res = await fetch(url, {
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
        setFormData({
          name: "",
          photo: "",
          rating: 5,
          comment: "",
          customerName: "",
          order: drivers.length,
        });
        alert("Gespeichert.");
      } else {
        alert("Speichern fehlgeschlagen.");
      }
    } catch {
      alert("Anfrage fehlgeschlagen.");
    } finally {
      setSaving(false);
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

    // حفظ الترتيب
    try {
      await fetch("/api/admin/content/drivers/reorder", {
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
        <p className="text-[#0d2137]/70">Laden…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#0d2137]">Inhaltsverwaltung</h1>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:opacity-95"
        >
          + Neuer Fahrer
        </button>
      </div>

      {/* Form */}
      {(editingId !== null || formData.name) && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-[#0d2137]">
            {editingId ? "Fahrer bearbeiten" : "Neuer Fahrer"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">Foto URL</label>
              <input
                type="url"
                value={formData.photo}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                placeholder="https://ui-avatars.com/api/?name=..."
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">Bewertung (1-5)</label>
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
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">Kundenname</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">Kommentar</label>
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
              {saving ? "Speichern…" : "Speichern"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
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
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Drivers List */}
      <div className="space-y-4">
        {drivers.length === 0 ? (
          <div className="rounded-xl border border-[#0d2137]/10 bg-white p-8 text-center text-[#0d2137]/60">
            <p>Noch keine Fahrer hinzugefügt.</p>
            <button
              type="button"
              onClick={handleAdd}
              className="mt-4 text-[var(--accent)] hover:underline"
            >
              Ersten Fahrer hinzufügen
            </button>
          </div>
        ) : (
          drivers
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((driver, index) => (
              <div
                key={driver.id || index}
                className="flex items-center gap-4 rounded-xl border border-[#0d2137]/10 bg-white p-4 shadow-sm"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[var(--accent)]/20">
                  <Image
                    src={driver.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=e85d04&color=fff&size=128`}
                    alt={driver.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#0d2137]">{driver.name}</h3>
                  <p className="text-sm text-[#0d2137]/70">
                    {driver.rating} ⭐ · {driver.customerName}
                  </p>
                  <p className="mt-1 text-sm italic text-[#0d2137]/60 line-clamp-1">
                    "{driver.comment}"
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleReorder(driver.id!, "up")}
                    disabled={index === 0}
                    className="rounded-lg border border-[#0d2137]/20 p-2 hover:bg-[#0d2137]/5 disabled:opacity-30"
                    title="Nach oben"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorder(driver.id!, "down")}
                    disabled={index === drivers.length - 1}
                    className="rounded-lg border border-[#0d2137]/20 p-2 hover:bg-[#0d2137]/5 disabled:opacity-30"
                    title="Nach unten"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(driver)}
                    className="rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm font-medium text-[#0d2137] hover:bg-[#0d2137]/5"
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={() => driver.id && handleDelete(driver.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
