"use client";

import Link from "next/link";
import { useAdminLocale } from "@/contexts/AdminLocaleContext";

export default function AdminBlogHubPage() {
  const { t } = useAdminLocale();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2137]">{t("blog.hubTitle")}</h1>
        <p className="mt-2 text-sm text-[#0d2137]/70">{t("blog.hubSubtitle")}</p>
        <p className="mt-2 text-sm text-[#0d2137]/70">{t("blog.hubMultilingual")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/blog/posts"
          className="rounded-xl border border-[#0d2137]/15 bg-white p-6 shadow-sm transition hover:border-[var(--accent)]/40 hover:shadow"
        >
          <h2 className="text-lg font-semibold text-[#0d2137]">{t("blog.postsCard")}</h2>
          <p className="mt-2 text-sm text-[#0d2137]/65">{t("blog.postsCardDesc")}</p>
        </Link>
        <Link
          href="/admin/blog/pages"
          className="rounded-xl border border-[#0d2137]/15 bg-white p-6 shadow-sm transition hover:border-[var(--accent)]/40 hover:shadow"
        >
          <h2 className="text-lg font-semibold text-[#0d2137]">{t("blog.pagesCard")}</h2>
          <p className="mt-2 text-sm text-[#0d2137]/65">{t("blog.pagesCardDesc")}</p>
        </Link>
      </div>
    </div>
  );
}
