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
    <main className="relative">
      <section className="border-b border-[#0d2137]/[0.08] bg-gradient-to-b from-white via-white to-[#f4f6f9] px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-2 h-1 w-16 rounded-full bg-[var(--accent)] shadow-sm shadow-[var(--accent)]/30" aria-hidden />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] sm:text-sm">
            {t("indexKicker")}
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-[1.15] tracking-tight text-[#0d2137] sm:text-4xl md:text-[2.75rem]">
            {t("indexTitle")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#0d2137]/72 sm:text-lg">
            {t("indexSubtitle")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        {posts.length === 0 ? (
          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#0d2137]/10 bg-white shadow-[0_24px_60px_-24px_rgba(13,33,55,0.25)]">
            <div className="border-b border-[#0d2137]/[0.06] bg-[#0d2137]/[0.02] px-6 py-5 sm:px-8">
              <h2 className="text-lg font-bold text-[#0d2137] sm:text-xl">{t("emptyTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#0d2137]/65">{t("empty")}</p>
            </div>
            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <p className="text-sm leading-relaxed text-[#0d2137]/75">{t("emptyHintPublic")}</p>
            </div>
          </div>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#0d2137]/10 bg-white shadow-[0_12px_40px_-20px_rgba(13,33,55,0.2)] ring-1 ring-transparent transition hover:border-[#0d2137]/16 hover:shadow-[0_20px_50px_-24px_rgba(13,33,55,0.28)] hover:ring-[var(--accent)]/15">
                  <Link href={`/${locale}/blog/${post.slug}`} className="block shrink-0">
                    <div className="relative aspect-[16/10] bg-[#0d2137]/[0.06]">
                      {post.featured_image_url ? (
                        <Image
                          src={post.featured_image_url}
                          alt=""
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized={post.featured_image_url.startsWith("http")}
                        />
                      ) : (
                        <div
                          className="absolute inset-0 bg-gradient-to-br from-[#0d2137]/12 via-[#0d2137]/6 to-[var(--accent)]/25"
                          aria-hidden
                        />
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <time
                      className="text-[11px] font-semibold uppercase tracking-wider text-[#0d2137]/45"
                      dateTime={post.published_at ?? undefined}
                    >
                      {formatDate(post.published_at, locale)}
                    </time>
                    {post.category ? (
                      <span className="mt-2 inline-block w-fit rounded-full bg-[var(--accent)]/12 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">
                        {post.category}
                      </span>
                    ) : null}
                    <h2 className="mt-3 text-lg font-bold leading-snug text-[#0d2137] sm:text-xl">
                      <Link
                        href={`/${locale}/blog/${post.slug}`}
                        className="transition hover:text-[var(--accent)]"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    {post.excerpt ? (
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[#0d2137]/68">
                        {post.excerpt}
                      </p>
                    ) : null}
                    <p className="mt-5 border-t border-[#0d2137]/[0.06] pt-4 text-xs font-medium text-[#0d2137]/50">
                      {post.author_name}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
