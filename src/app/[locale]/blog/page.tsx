import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listPublishedPosts } from "@/lib/blog";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("metaIndexTitle"),
    description: t("metaIndexDescription"),
    openGraph: {
      title: t("metaIndexTitle"),
      description: t("metaIndexDescription"),
      siteName: "TransPool24",
    },
  };
}

function formatDate(iso: string | null, locale: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as Locale;
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const t = await getTranslations("blog");
  const posts = await listPublishedPosts(locale);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-12 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
          {t("indexKicker")}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0d2137] sm:text-4xl">
          {t("indexTitle")}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[#0d2137]/75">{t("indexSubtitle")}</p>
      </header>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-[#0d2137]/10 bg-white px-6 py-12 text-center text-[#0d2137]/65">
          {t("empty")}
        </p>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#0d2137]/10 bg-white shadow-sm transition hover:border-[#0d2137]/18 hover:shadow-md">
                <Link href={`/${locale}/blog/${post.slug}`} className="block shrink-0">
                  <div className="relative aspect-[16/10] bg-[#0d2137]/[0.06]">
                    {post.featured_image_url ? (
                      <Image
                        src={post.featured_image_url}
                        alt=""
                        fill
                        className="object-cover transition group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized={post.featured_image_url.startsWith("http")}
                      />
                    ) : (
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-[#0d2137]/15 to-[var(--accent)]/20"
                        aria-hidden
                      />
                    )}
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <time
                    className="text-xs font-medium text-[#0d2137]/50"
                    dateTime={post.published_at ?? undefined}
                  >
                    {formatDate(post.published_at, locale)}
                  </time>
                  {post.category ? (
                    <span className="mt-1 inline-block w-fit rounded-full bg-[var(--accent)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                      {post.category}
                    </span>
                  ) : null}
                  <h2 className="mt-3 text-lg font-semibold leading-snug text-[#0d2137]">
                    <Link
                      href={`/${locale}/blog/${post.slug}`}
                      className="hover:text-[var(--accent)] hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt ? (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[#0d2137]/70">
                      {post.excerpt}
                    </p>
                  ) : null}
                  <p className="mt-4 text-xs text-[#0d2137]/45">{post.author_name}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
