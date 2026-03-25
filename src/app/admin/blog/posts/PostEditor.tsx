"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { locales, type Locale } from "@/i18n/routing";
import { slugifyInput } from "@/lib/blog";

type PostRow = {
  id: string;
  locale: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  featured_image_url: string | null;
  category: string | null;
  tags: string[];
  status: "draft" | "published";
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  author_name: string;
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

export function PostEditor({ postId }: { postId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(postId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [locale, setLocale] = useState<Locale>("de");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedAtLocal, setPublishedAtLocal] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [authorName, setAuthorName] = useState("TransPool24");
  const [autoTranslateAll, setAutoTranslateAll] = useState(true);
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/blog/posts/${postId}`);
      if (!r.ok) {
        setError("Eintrag nicht gefunden");
        return;
      }
      const j = (await r.json()) as { post: PostRow };
      const p = j.post;
      setLocale(p.locale as Locale);
      setSlug(p.slug);
      setTitle(p.title);
      setExcerpt(p.excerpt ?? "");
      setBody(p.body ?? "");
      setFeaturedImageUrl(p.featured_image_url ?? "");
      setCategory(p.category ?? "");
      setTagsStr((p.tags ?? []).join(", "));
      setStatus(p.status);
      setPublishedAtLocal(isoToDatetimeLocal(p.published_at));
      setMetaTitle(p.meta_title ?? "");
      setMetaDescription(p.meta_description ?? "");
      setAuthorName(p.author_name ?? "TransPool24");
      try {
        const raw = sessionStorage.getItem("blog_last_translate");
        if (raw && postId) {
          const o = JSON.parse(raw) as { postId?: string; locales?: string[]; note?: string | null };
          if (o.postId === postId) {
            sessionStorage.removeItem("blog_last_translate");
            if (o.locales?.length) {
              setInfo(`Übersetzt in: ${o.locales.join(", ")}${o.note ? ` — ${o.note}` : ""}`);
            } else if (o.note) {
              setInfo(o.note);
            }
          }
        }
      } catch {
        /* ignore */
      }
    } catch {
      setError("Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, [postId]);

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
    setInfo(null);
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const published_at = datetimeLocalToIso(publishedAtLocal);

    try {
      if (isEdit && postId) {
        const r = await fetch(`/api/admin/blog/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            slug: slugifyInput(slug) || slug.trim(),
            title,
            excerpt: excerpt || null,
            body,
            featured_image_url: featuredImageUrl || null,
            category: category || null,
            tags,
            status,
            published_at: status === "published" ? published_at || new Date().toISOString() : published_at,
            meta_title: metaTitle || null,
            meta_description: metaDescription || null,
            author_name: authorName || "TransPool24",
          }),
        });
        const j = (await r.json()) as { error?: string };
        if (!r.ok) throw new Error(j.error || "Speichern fehlgeschlagen");
      } else {
        const r = await fetch("/api/admin/blog/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            slug: slugifyInput(slug) || slug.trim(),
            title,
            excerpt: excerpt || null,
            body,
            featured_image_url: featuredImageUrl || null,
            category: category || null,
            tags,
            status,
            published_at,
            meta_title: metaTitle || null,
            meta_description: metaDescription || null,
            author_name: authorName || "TransPool24",
            auto_translate_all: autoTranslateAll,
          }),
        });
        const j = (await r.json()) as {
          id?: string;
          error?: string;
          slug?: string;
          translatedLocales?: string[];
          translationNote?: string;
        };
        if (!r.ok) throw new Error(j.error || "Anlegen fehlgeschlagen");
        if (j.id && (j.translatedLocales?.length || j.translationNote)) {
          try {
            sessionStorage.setItem(
              "blog_last_translate",
              JSON.stringify({
                postId: j.id,
                locales: j.translatedLocales ?? [],
                note: j.translationNote ?? null,
              })
            );
          } catch {
            /* ignore */
          }
        }
        if (j.id) {
          router.replace(`/admin/blog/posts/${j.id}`);
          return;
        }
      }
      router.push("/admin/blog/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!postId || !confirm("Diesen Artikel wirklich löschen?")) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/blog/posts/${postId}`, { method: "DELETE" });
      if (!r.ok) {
        const j = (await r.json()) as { error?: string };
        throw new Error(j.error || "Löschen fehlgeschlagen");
      }
      router.push("/admin/blog/posts");
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
        <Link href="/admin/blog/posts" className="text-sm font-medium text-[var(--accent)] hover:underline">
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
      {info ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          {info}
        </p>
      ) : null}

      {!isEdit ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#0d2137]/15 bg-white p-4 shadow-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-[#0d2137]/30"
            checked={autoTranslateAll}
            onChange={(e) => setAutoTranslateAll(e.target.checked)}
          />
          <span className="text-sm text-[#0d2137]/85">
            <span className="font-semibold text-[#0d2137]">In alle Sprachen übersetzen (KI)</span>
            <span className="mt-1 block text-[#0d2137]/70">
              Nach dem Speichern werden Kopien für alle anderen Website-Sprachen erzeugt (gleicher Slug). Erfordert{" "}
              <code className="rounded bg-[#0d2137]/10 px-1">OPENAI_API_KEY</code> in Vercel. Ohne Key wird nur
              dieser Artikel gespeichert.
            </span>
          </span>
        </label>
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
          <label className={labelClass}>Slug (URL, lateinisch)</label>
          <input
            className={inputClass}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="z.B. dieselpreise-deutschland"
            required
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Titel</label>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div>
        <label className={labelClass}>Teaser / Kurzbeschreibung</label>
        <textarea className={`${inputClass} min-h-[5rem]`} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </div>

      <div>
        <label className={labelClass}>Text (Markdown)</label>
        <textarea
          className={`${inputClass} min-h-[16rem] font-mono text-xs`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Titelbild-URL</label>
        <input
          className={inputClass}
          value={featuredImageUrl}
          onChange={(e) => setFeaturedImageUrl(e.target.value)}
          placeholder="https://..."
        />
        <div className="mt-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#0d2137]/80">
            <span className="rounded-lg border border-[#0d2137]/20 bg-white px-3 py-1.5 font-medium hover:bg-[#0d2137]/5">
              {uploading ? "Hochladen…" : "Bild hochladen"}
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => void onUpload(e)} />
          </label>
          <span className="ms-2 text-xs text-[#0d2137]/50">Bucket „blog“ in Supabase</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Kategorie</label>
          <input className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Tags (kommagetrennt)</label>
          <input className={inputClass} value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Status</label>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")}>
            <option value="draft">Entwurf</option>
            <option value="published">Veröffentlicht</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Veröffentlicht am (lokal)</label>
          <input
            type="datetime-local"
            className={inputClass}
            value={publishedAtLocal}
            onChange={(e) => setPublishedAtLocal(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Autor-Anzeigename</label>
        <input className={inputClass} value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass}>SEO-Titel (optional)</label>
          <input className={inputClass} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>SEO-Beschreibung (optional)</label>
          <textarea className={`${inputClass} min-h-[4rem]`} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
        </div>
      </div>
    </form>
  );
}
