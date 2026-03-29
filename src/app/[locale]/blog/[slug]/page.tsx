import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BlogMarkdown } from "@/components/BlogMarkdown";
import { getPublishedPostBySlug } from "@/lib/blog";
import { IconCalendar, IconUser } from "@/components/blog/BlogNewsIcons";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { localeAlternatesAndSocial } from "@/lib/locale-seo-metadata";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale: loc, slug } = await params;
  const locale = loc as Locale;
  const post = await getPublishedPostBySlug(locale, slug);
  const t = await getTranslations({ locale, namespace: "blog" });
  if (!post) {
    return { title: t("notFoundTitle") };
  }
  const title = post.meta_title?.trim() || post.title;
  const description = post.meta_description?.trim() || post.excerpt || t("metaIndexDescription");
  const pageTitle = `${title} | ${t("magazineTitle")}`;
  return localeAlternatesAndSocial(locale, `/blog/${slug}`, {
    title: pageTitle,
    description,
    ogType: "article",
    publishedTime: post.published_at ?? undefined,
    ogImage: post.featured_image_url ?? undefined,
  });
}

function formatDate(iso: string | null, locale: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { locale: loc, slug } = await params;
  const locale = loc as Locale;
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const post = await getPublishedPostBySlug(locale, slug);
  if (!post) {
    notFound();
  }

  const t = await getTranslations("blog");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.published_at ?? undefined,
    author: { "@type": "Organization", name: post.author_name },
    image: post.featured_image_url ?? undefined,
    description: post.excerpt ?? undefined,
  };

  return (
    <main className="bg-[#f5f6f8] px-4 py-12 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
          {post.category ? (
            <span className="inline-block text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
              {post.category}
            </span>
          ) : null}
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-[#1a1a1a] sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-[#5c5c5c]">
            <span className="inline-flex items-center gap-2">
              <IconCalendar className="h-4 w-4 shrink-0 text-[var(--accent)]" />
              <time className="font-medium" dateTime={post.published_at ?? undefined}>
                {formatDate(post.published_at, locale)}
              </time>
            </span>
            <span className="inline-flex items-center gap-2">
              <IconUser className="h-4 w-4 shrink-0 text-[var(--accent)]" />
              <span className="font-medium">{t("byAuthor", { author: post.author_name })}</span>
            </span>
          </div>
          {post.tags?.length ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md bg-[#f5f6f8] px-2.5 py-1 text-xs font-medium text-[#5c5c5c]"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        {post.featured_image_url ? (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-xl bg-[#e8eaed] shadow-inner ring-1 ring-black/[0.04]">
            <Image
              src={post.featured_image_url}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 48rem"
              unoptimized={post.featured_image_url.startsWith("http")}
            />
          </div>
        ) : null}

        {post.excerpt ? (
          <p className="mb-8 text-lg font-medium leading-relaxed text-[#3d3d3d]">{post.excerpt}</p>
        ) : null}

        <BlogMarkdown markdown={post.body || ""} />
      </article>
    </main>
  );
}
