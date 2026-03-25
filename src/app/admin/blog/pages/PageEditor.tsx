"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { locales, type Locale } from "@/i18n/routing";
import { slugifyInput } from "@/lib/blog";

type PageRow = {
  id: string;
  locale: string;
  slug: string;
  title: string;
  body: string;
  featured_image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  nav_order: number;
};

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[#0d2137]/20 bg-white px-3 py-2 text-sm text-[#0d2137] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";
const labelClass = "block text-sm font-medium text-[#0d2137]";

export function PageEditor({ pageId }: { pageId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(pageId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [locale, setLocale] = useState<Locale>("de");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedAtLocal, setPublishedAtLocal] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [navOrder, setNavOrder] = useState(0);

  const load = useCallback(async () => {
    if (!pageId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/blog/pages/${pageId}`);
      if (!r.ok) {
        setError("Seite nicht gefunden");
        return;
      }
      const j = (await r.json()) as { page: PageRow };
      const p = j.page;
      setLocale(p.locale as Locale);
      setSlug(p.slug);
      setTitle(p.title);
      setBody(p.body ?? "");
      setFeaturedImageUrl(p.featured_image_url ?? "");
      setStatus(p.status);
      setPublishedAtLocal(isoToDatetimeLocal(p.published_at));
      setMetaTitle(p.meta_title ?? "");
      setMetaDescription(p.meta_description ?? "");
      setNavOrder(p.nav_order ?? 0);
    } catch {
      setError("Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/blog/upload", { method: "POST", body: fd });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) throw new Error(j.error || "Upload fehlgeschlagen");
      if (j.url) setFeaturedImageUrl(j.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const published_at = datetimeLocalToIso(publishedAtLocal);

    try {
      if (isEdit && pageId) {
        const r = await fetch(`/api/admin/blog/pages/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            slug: slugifyInput(slug) || slug.trim(),
            title,
            body,
            featured_image_url: featuredImageUrl || null,
            status,
            published_at: status === "published" ? published_at || new Date().toISOString() : published_at,
            meta_title: metaTitle || null,
            meta_description: metaDescription || null,
            nav_order: navOrder,
          }),
        });
        const j = (await r.json()) as { error?: string };
        if (!r.ok) throw new Error(j.error || "Speichern fehlgeschlagen");
      } else {
        const r = await fetch("/api/admin/blog/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            slug: slugifyInput(slug) || slug.trim(),
            title,
            body,
            featured_image_url: featuredImageUrl || null,
            status,
            published_at,
            meta_title: metaTitle || null,
            meta_description: metaDescription || null,
            nav_order: navOrder,
          }),
        });
        const j = (await r.json()) as { id?: string; error?: string };
        if (!r.ok) throw new Error(j.error || "Anlegen fehlgeschlagen");
        if (j.id) {
          router.replace(`/admin/blog/pages/${j.id}`);
          return;
        }
      }
      router.push("/admin/blog/pages");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!pageId || !confirm("Diese Seite wirklich löschen?")) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/blog/pages/${pageId}`, { method: "DELETE" });
      if (!r.ok) {
        const j = (await r.json()) as { error?: string };
        throw new Error(j.error || "Löschen fehlgeschlagen");
      }
      router.push("/admin/blog/pages");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-[#0d2137]/70">Laden…</p>;
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/admin/blog/pages" className="text-sm font-medium text-[var(--accent)] hover:underline">
          ← Zur Liste
        </Link>
        <div className="flex gap-2">
          {isEdit ? (
            <button
              type="button"
              onClick={() => void onDelete()}
              disabled={saving}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
            >
              Löschen
            </button>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#0d2137] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d2137]/90 disabled:opacity-50"
          >
            {saving ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label className={labelClass}>Sprache</label>
          <select className={inputClass} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
            {locales.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Slug (URL)</label>
          <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className={labelClass}>Titel (Navigation)</label>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div>
        <label className={labelClass}>Inhalt (Markdown)</label>
        <textarea
          className={`${inputClass} min-h-[14rem] font-mono text-xs`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Bild-URL (optional)</label>
        <input className={inputClass} value={featuredImageUrl} onChange={(e) => setFeaturedImageUrl(e.target.value)} />
        <div className="mt-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#0d2137]/80">
            <span className="rounded-lg border border-[#0d2137]/20 bg-white px-3 py-1.5 font-medium hover:bg-[#0d2137]/5">
              {uploading ? "Hochladen…" : "Bild hochladen"}
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => void onUpload(e)} />
          </label>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Status</label>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")}>
            <option value="draft">Entwurf</option>
            <option value="published">Veröffentlicht</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Veröffentlicht am</label>
          <input
            type="datetime-local"
            className={inputClass}
            value={publishedAtLocal}
            onChange={(e) => setPublishedAtLocal(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Nav-Reihenfolge</label>
          <input
            type="number"
            className={inputClass}
            value={navOrder}
            onChange={(e) => setNavOrder(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass}>SEO-Titel</label>
          <input className={inputClass} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>SEO-Beschreibung</label>
          <textarea className={`${inputClass} min-h-[4rem]`} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
        </div>
      </div>
    </form>
  );
}
