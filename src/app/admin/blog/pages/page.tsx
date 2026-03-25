"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { locales, type Locale } from "@/i18n/routing";

type Page = {
  id: string;
  locale: string;
  slug: string;
  title: string;
  status: string;
  nav_order: number;
  updated_at: string;
};

export default function AdminBlogPagesListPage() {
  const [filter, setFilter] = useState<Locale | "">("");
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const q = filter ? `?locale=${encodeURIComponent(filter)}` : "";
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/admin/blog/pages${q}`);
        const j = (await r.json()) as { pages?: Page[]; error?: string };
        if (cancelled) return;
        if (j.error) setError(j.error);
        else setPages(j.pages ?? []);
      } catch {
        if (!cancelled) setError("Laden fehlgeschlagen");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2137]">Blog-Seiten</h1>
          <p className="mt-1 text-sm text-[#0d2137]/65">Statische Seiten in der Blog-Navigation</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-[#0d2137]/80">
            Sprache
            <select
              className="ms-2 rounded-lg border border-[#0d2137]/20 bg-white px-2 py-1.5 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as Locale | "")}
            >
              <option value="">Alle</option>
              {locales.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>
          <Link
            href="/admin/blog/pages/new"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Neue Seite
          </Link>
          <Link href="/admin/blog" className="text-sm text-[#0d2137]/70 hover:underline">
            Blog-Übersicht
          </Link>
        </div>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <p className="text-[#0d2137]/65">Laden…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#0d2137]/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#0d2137]/10 bg-[#0d2137]/[0.03] text-xs uppercase tracking-wide text-[#0d2137]/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Titel</th>
                <th className="px-4 py-3 font-semibold">Sprache</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Nav</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-b border-[#0d2137]/5 hover:bg-[#0d2137]/[0.02]">
                  <td className="px-4 py-3 font-medium text-[#0d2137]">
                    <Link href={`/admin/blog/pages/${p.id}`} className="hover:text-[var(--accent)] hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#0d2137]/75">{p.locale}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#0d2137]/65">{p.slug}</td>
                  <td className="px-4 py-3 text-[#0d2137]/65">{p.nav_order}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.status === "published"
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                          : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pages.length === 0 ? <p className="px-4 py-8 text-center text-[#0d2137]/55">Keine Einträge</p> : null}
        </div>
      )}
    </div>
  );
}
