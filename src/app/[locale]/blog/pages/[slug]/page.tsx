import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BlogMarkdown } from "@/components/BlogMarkdown";
import { getPublishedPageBySlug } from "@/lib/blog";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale: loc, slug } = await params;
  const locale = loc as Locale;
  const page = await getPublishedPageBySlug(locale, slug);
  const t = await getTranslations({ locale, namespace: "blog" });
  if (!page) {
    return { title: t("notFoundTitle") };
  }
  const title = page.meta_title?.trim() || page.title;
  const description = page.meta_description?.trim() || t("metaIndexDescription");
  return {
    title: `${title} | ${t("magazineTitle")}`,
    description,
    openGraph: { title, description },
  };
}

export default async function BlogStaticPage({ params }: Props) {
  const { locale: loc, slug } = await params;
  const locale = loc as Locale;
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const page = await getPublishedPageBySlug(locale, slug);
  if (!page) {
    notFound();
  }

  const t = await getTranslations("blog");

  return (
    <main className="bg-[#f5f6f8] px-4 py-12 sm:px-6 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.05] sm:p-10">
        <nav className="mb-8">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-[var(--accent)] transition hover:gap-3"
          >
            <span aria-hidden>←</span>
            {t("backToMagazine")}
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#1a1a1a] sm:text-4xl">{page.title}</h1>
        </header>

        {page.featured_image_url ? (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-xl bg-[#e8eaed] ring-1 ring-black/[0.04]">
            <Image
              src={page.featured_image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 48rem"
              unoptimized={page.featured_image_url.startsWith("http")}
            />
          </div>
        ) : null}

        <BlogMarkdown markdown={page.body || ""} />
      </article>
    </main>
  );
}
