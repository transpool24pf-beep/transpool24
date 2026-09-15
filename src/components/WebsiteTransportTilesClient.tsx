"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cmsFetch } from "@/lib/website-cms-fetch";

interface Tile {
  id?: number;
  title: string;
  imageUrl: string;
  driverPhotoUrl?: string;
  order?: number;
}

type DriverPhotoOption = {
  name: string;
  photoUrl: string;
  source: "homepage" | "approved";
  driverNumber?: number | null;
};

type Props = { apiBase: string };

const UPLOAD_URL = "/api/website/content/transport-tiles/upload";

export function WebsiteTransportTilesClient({ apiBase }: Props) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Tile>({
    title: "",
    imageUrl: "",
    driverPhotoUrl: "",
    order: 0,
  });
  const [driverPhotos, setDriverPhotos] = useState<DriverPhotoOption[]>([]);
  const [driverNumberQuery, setDriverNumberQuery] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    cmsFetch(`${apiBase}`)
      .then((r) => r.json())
      .then((data) => setTiles(data.tiles || []))
      .catch(() => setTiles([]))
      .finally(() => setLoading(false));
    cmsFetch("/api/website/content/transport-tiles/driver-photos")
      .then((r) => r.json())
      .then((data) => setDriverPhotos(Array.isArray(data.photos) ? data.photos : []))
      .catch(() => setDriverPhotos([]));
  }, [apiBase]);

  const handleAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    setDriverNumberQuery("");
    setFormData({ title: "", imageUrl: "", driverPhotoUrl: "", order: tiles.length });
  };

  const handleEdit = (tile: Tile) => {
    setEditingId(tile.id ?? null);
    setDriverNumberQuery("");
    setFormData({
      ...tile,
      driverPhotoUrl: tile.driverPhotoUrl ?? "",
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Diese Kachel wirklich löschen?")) return;
    setSaving(true);
    try {
      const res = await cmsFetch(`${apiBase}/${id}`, { method: "DELETE" });
      if (res.ok) setTiles(tiles.filter((t) => t.id !== id));
      else alert("Löschen fehlgeschlagen.");
    } catch {
      alert("Anfrage fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl?.trim()) {
      alert("Bitte ein Bild hochladen oder eine Bild-URL angeben.");
      return;
    }
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
          setTiles(tiles.map((t) => (t.id === editingId ? data.tile : t)));
        } else {
          setTiles([...tiles, data.tile]);
        }
        if (formData.driverPhotoUrl && !(data.tile?.driverPhotoUrl ?? "").trim()) {
          alert(
            "صورة السائق لم تُحفظ في قاعدة البيانات. شغّل الملف supabase/homepage_transport_tiles_driver_photo.sql في Supabase SQL Editor ثم أعد الحفظ.",
          );
        } else {
          setEditingId(null);
          setIsAdding(false);
          setFormData({ title: "", imageUrl: "", driverPhotoUrl: "", order: tiles.length });
          alert("Gespeichert.");
        }
      } else {
        const errBody = await res.json().catch(() => ({}));
        const msg =
          typeof (errBody as { error?: string }).error === "string"
            ? (errBody as { error: string }).error
            : "Speichern fehlgeschlagen.";
        alert(msg);
      }
    } catch {
      alert("Anfrage fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Bitte ein Bild wählen (JPEG, PNG oder WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Datei zu groß (max. 5 MB).");
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
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen.");
      if (data.url) setFormData((prev) => ({ ...prev, imageUrl: data.url! }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleLookupByDriverNumber = async () => {
    const num = parseInt(driverNumberQuery.trim(), 10);
    if (!Number.isFinite(num) || num < 1) {
      alert("Bitte eine gültige Fahrernummer eingeben. / أدخل رقم سائق صحيح.");
      return;
    }
    setLookupLoading(true);
    try {
      const res = await cmsFetch("/api/website/content/drivers/lookup-by-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverNumber: num }),
      });
      const data = (await res.json()) as { photoUrl?: string; fullName?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Lookup fehlgeschlagen.");
      if (!data.photoUrl) throw new Error("Keine Bild-URL.");
      setFormData((prev) => ({ ...prev, driverPhotoUrl: data.photoUrl! }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lookup fehlgeschlagen.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleReorder = async (id: number, direction: "up" | "down") => {
    const sorted = [...tiles].sort((a, b) => (a.order || 0) - (b.order || 0));
    const index = sorted.findIndex((t) => t.id === id);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;

    const next = [...sorted];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    next.forEach((t, i) => {
      t.order = i;
    });
    setTiles(next);

    try {
      await cmsFetch(`${apiBase}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiles: next.map((t) => ({ id: t.id, order: t.order })) }),
      });
    } catch {
      // silent
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-[#0d2137]">Homepage – Transport-Kacheln</h1>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:opacity-95"
        >
          + Neue Kachel
        </button>
      </div>

      <p className="mb-8 text-sm text-[#0d2137]/70">
        Bilder und Überschriften für den Bereich unter „Fahrer-Bewertungen“ auf der Startseite. Hochformat
        (3:4) wirkt am besten.
      </p>

      {(editingId !== null || isAdding) && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-[#0d2137]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-[#0d2137]">
            {editingId ? "Kachel bearbeiten" : "Neue Kachel"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">Titel (auf dem Bild)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full rounded-lg border border-[#0d2137]/20 px-4 py-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">Bild</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-[var(--accent)]/30 bg-gray-100">
                  {formData.imageUrl ? (
                    <Image
                      src={formData.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized={formData.imageUrl.startsWith("http")}
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
                    onChange={handleImageFile}
                    disabled={imageUploading}
                    className="block w-full text-sm text-[#0d2137] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-95 disabled:opacity-50"
                  />
                  <p className="text-xs text-[#0d2137]/60">
                    JPEG/PNG/WebP, max. 5 MB. Wird in Supabase Storage unter{" "}
                    <code className="rounded bg-[#0d2137]/5 px-1">homepage-transport/</code> gespeichert.
                  </p>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#0d2137]/70">
                      Bild-URL (optional)
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://…"
                      className="w-full rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  {imageUploading && <p className="text-sm text-[var(--accent)]">Wird hochgeladen…</p>}
                </div>
              </div>
            </div>
            <div className="sm:col-span-2 rounded-xl border border-[#0d2137]/10 bg-[#0d2137]/[0.03] p-4">
              <label className="mb-1 block text-sm font-medium text-[#0d2137]/80">
                صورة السائق من صفحة الموقع / Fahrerfoto von der Website
              </label>
              <p className="mb-3 text-xs text-[#0d2137]/60">
                اختر صورة سائق من تقييمات الصفحة أو من السائقين المعتمدين. تظهر دائرة فوق بطاقة «خدمات النقل
                الشائعة». يمكنك أيضاً جعلها صورة البطاقة نفسها.
              </p>
              <div className="mb-3 flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[var(--accent)] bg-gray-100">
                  {formData.driverPhotoUrl ? (
                    <Image
                      src={formData.driverPhotoUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized={formData.driverPhotoUrl.startsWith("http")}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-[#0d2137]/40">
                      —
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={driverNumberQuery}
                      onChange={(e) => setDriverNumberQuery(e.target.value)}
                      placeholder="Fahrernr. / رقم السائق"
                      className="w-36 rounded-lg border border-[#0d2137]/20 px-3 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => void handleLookupByDriverNumber()}
                      disabled={lookupLoading}
                      className="rounded-lg border border-[#0d2137]/20 px-3 py-1.5 text-sm font-medium hover:bg-[#0d2137]/5 disabled:opacity-50"
                    >
                      {lookupLoading ? "…" : "Übernehmen / اختيار"}
                    </button>
                    {formData.driverPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, imageUrl: prev.driverPhotoUrl || prev.imageUrl }))
                        }
                        className="rounded-lg border border-[var(--accent)]/40 px-3 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10"
                      >
                        استخدام كصورة البطاقة / Als Kachelbild
                      </button>
                    ) : null}
                    {formData.driverPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, driverPhotoUrl: "" }))}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                      >
                        Entfernen / إزالة
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              {driverPhotos.length === 0 ? (
                <p className="text-xs text-[#0d2137]/50">
                  لا توجد صور بعد — أضف سائقين من تقييمات الصفحة أو من طلبات السائقين المعتمدة.
                </p>
              ) : (
                <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
                  {driverPhotos.map((p) => {
                    const selected = formData.driverPhotoUrl === p.photoUrl;
                    const label = p.driverNumber
                      ? `${p.name} · ${String(p.driverNumber).padStart(5, "0")}`
                      : p.name;
                    return (
                      <button
                        key={`${p.source}-${p.photoUrl}`}
                        type="button"
                        title={label}
                        onClick={() => setFormData((prev) => ({ ...prev, driverPhotoUrl: p.photoUrl }))}
                        className={`overflow-hidden rounded-lg border-2 text-start ${
                          selected ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/40" : "border-transparent"
                        }`}
                      >
                        <span className="relative block aspect-square">
                          <Image
                            src={p.photoUrl}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                            unoptimized={p.photoUrl.startsWith("http")}
                          />
                        </span>
                        <span className="block truncate px-1 py-1 text-[10px] text-[#0d2137]/70">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
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
                setIsAdding(false);
                setFormData({ title: "", imageUrl: "", driverPhotoUrl: "", order: tiles.length });
              }}
              className="rounded-lg border border-[#0d2137]/20 px-4 py-2 font-medium text-[#0d2137] hover:bg-[#0d2137]/5"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {tiles.length === 0 ? (
          <div className="rounded-xl border border-[#0d2137]/10 bg-white p-8 text-center text-[#0d2137]/60">
            <p>Noch keine Kacheln.</p>
            <button type="button" onClick={handleAdd} className="mt-4 text-[var(--accent)] hover:underline">
              Erste Kachel hinzufügen
            </button>
          </div>
        ) : (
          [...tiles]
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((tile, index, arr) => (
              <div
                key={tile.id || index}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-[#0d2137]/10 bg-white p-4 shadow-sm"
              >
                <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--accent)]/20">
                  <Image
                    src={tile.imageUrl || "/logo.png"}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={!tile.imageUrl || tile.imageUrl.startsWith("http")}
                  />
                </div>
                {tile.driverPhotoUrl ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-[var(--accent)]">
                    <Image
                      src={tile.driverPhotoUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized={tile.driverPhotoUrl.startsWith("http")}
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[#0d2137]">{tile.title}</h3>
                  <p className="mt-1 truncate text-xs text-[#0d2137]/50">{tile.imageUrl}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => tile.id != null && handleReorder(tile.id, "up")}
                    disabled={index === 0}
                    className="rounded-lg border border-[#0d2137]/20 p-2 hover:bg-[#0d2137]/5 disabled:opacity-30"
                    title="Nach oben"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => tile.id != null && handleReorder(tile.id, "down")}
                    disabled={index === arr.length - 1}
                    className="rounded-lg border border-[#0d2137]/20 p-2 hover:bg-[#0d2137]/5 disabled:opacity-30"
                    title="Nach unten"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(tile)}
                    className="rounded-lg border border-[#0d2137]/20 px-3 py-2 text-sm font-medium text-[#0d2137] hover:bg-[#0d2137]/5"
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={() => tile.id != null && handleDelete(tile.id)}
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
