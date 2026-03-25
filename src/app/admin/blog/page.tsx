import Link from "next/link";

export default function AdminBlogHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2137]">Blog / Magazin</h1>
        <p className="mt-2 text-sm text-[#0d2137]/70">
          Redaktionelle Inhalte (Transport, Märkte, Brennstoffpreise). Veröffentlichte Artikel erscheinen unter{" "}
          <code className="rounded bg-[#0d2137]/10 px-1">/[Sprache]/blog</code>. Bitte SQL{" "}
          <code className="rounded bg-[#0d2137]/10 px-1">supabase/blog.sql</code> in Supabase ausführen.
        </p>
        <p className="mt-2 text-sm text-[#0d2137]/70">
          <strong className="font-semibold text-[#0d2137]">Mehrsprachig:</strong> Beim neuen Artikel Option „In alle
          Sprachen übersetzen“ — setzt <code className="rounded bg-[#0d2137]/10 px-1">OPENAI_API_KEY</code> in den
          Vercel-Umgebungsvariablen (OpenAI API). Ohne Key wird nur die gewählte Sprache gespeichert.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/blog/posts"
          className="rounded-xl border border-[#0d2137]/15 bg-white p-6 shadow-sm transition hover:border-[var(--accent)]/40 hover:shadow"
        >
          <h2 className="text-lg font-semibold text-[#0d2137]">Artikel</h2>
          <p className="mt-2 text-sm text-[#0d2137]/65">Beiträge mit Bild, Markdown-Text, Kategorie und Tags.</p>
        </Link>
        <Link
          href="/admin/blog/pages"
          className="rounded-xl border border-[#0d2137]/15 bg-white p-6 shadow-sm transition hover:border-[var(--accent)]/40 hover:shadow"
        >
          <h2 className="text-lg font-semibold text-[#0d2137]">Statische Seiten</h2>
          <p className="mt-2 text-sm text-[#0d2137]/65">
            z. B. Über das Magazin, Impressum-Hinweis, Disclaimer — erscheinen in der Blog-Navigation.
          </p>
        </Link>
      </div>
    </div>
  );
}
