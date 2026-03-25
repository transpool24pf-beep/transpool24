import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BlogMarkdown } from "@/components/BlogMarkdown";
import { getPublishedPostBySlug } from "@/lib/blog";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

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
  return {
    title: `${title} | ${t("magazineTitle")}`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      images: post.featured_image_url ? [{ url: post.featured_image_url }] : undefined,
    },
  };
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
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-8 text-sm">
        <Link href={`/${locale}/blog`} className="font-medium text-[var(--accent)] hover:underline">
          ← {t("backToMagazine")}
        </Link>
      </nav>

      <article>
        <header className="mb-8">
          {post.category ? (
            <span className="inline-block rounded-full bg-[var(--accent)]/12 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              {post.category}
            </span>
          ) : null}
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0d2137] sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#0d2137]/60">
            <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at, locale)}</time>
            <span>{post.author_name}</span>
          </div>
          {post.tags?.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md bg-[#0d2137]/[0.06] px-2 py-0.5 text-xs text-[#0d2137]/75"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        {post.featured_image_url ? (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl bg-[#0d2137]/[0.06]">
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
          <p className="mb-8 text-lg font-medium leading-relaxed text-[#0d2137]/85">{post.excerpt}</p>
        ) : null}

        <BlogMarkdown markdown={post.body || ""} />
      </article>
    </main>
  );
}
