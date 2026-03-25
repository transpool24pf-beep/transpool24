import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listPublishedPosts } from "@/lib/blog";
import { BlogNewsCard } from "@/components/blog/BlogNewsCard";
import { HomeLogisticsHero } from "@/components/HomeLogisticsHero";
import { HomeAboutCollage } from "@/components/HomeAboutCollage";
import { BlogTemplateAfterPosts, BlogTemplateBeforePosts } from "@/components/blog/BlogMarketingSections";
import { getHomepageHero } from "@/lib/homepage-hero";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export const revalidate = 60;

const HERO_FALLBACK_IMAGE = "/images/5677.png";

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

function formatDateLong(iso: string | null, locale: string) {
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

export default async function BlogIndexPage({ params }: Props) {
  const { locale: loc } = await params;
  const locale = loc as Locale;
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const t = await getTranslations("blog");
  const posts = await listPublishedPosts(locale);
  const hero = await getHomepageHero(locale);

  const heroImage = hero.imageUrl || HERO_FALLBACK_IMAGE;
  const heroSubtitle = hero.subtitle?.trim() || t("template.heroSubtitleGermany");
  const primaryCta = (hero.cta && hero.cta.trim()) || t("template.heroPrimary");
  const secondaryCta = t("template.heroSecondary");

  const featured = posts.slice(0, 2);
  const more = posts.slice(2);

  return (
    <main className="relative">
      <HomeLogisticsHero
        locale={locale}
        heroImage={heroImage}
        cmsHeadline={hero.headline}
        heroSubtitle={heroSubtitle}
        primaryCta={primaryCta}
        secondaryCta={secondaryCta}
        truckImageUrl={hero.truckImageUrl}
      />
      <HomeAboutCollage locale={locale} />
      <BlogTemplateBeforePosts locale={locale} />

      <section className="bg-[#f5f6f8] px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          {posts.length === 0 ? (
            <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.05] sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{t("indexNewsKicker")}</p>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-[#1a1a1a] sm:text-4xl">
                {t.rich("indexNewsTitle", {
                  accent: (chunks) => <span className="text-[var(--accent)]">{chunks}</span>,
                })}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-[#6b6b6b]">{t("indexNewsDescription")}</p>
              <div className="mt-8 border-t border-black/[0.06] pt-8">
                <h2 className="text-lg font-bold text-[#1a1a1a]">{t("emptyTitle")}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#6b6b6b]">{t("empty")}</p>
                <p className="mt-4 text-sm leading-relaxed text-[#6b6b6b]">{t("emptyHintPublic")}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-14">
                <div className="lg:col-span-4 lg:pt-2">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                    {t("indexNewsKicker")}
                  </p>
                  <h1 className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight text-[#1a1a1a] sm:text-4xl lg:text-[2.35rem]">
                    {t.rich("indexNewsTitle", {
                      accent: (chunks) => <span className="text-[var(--accent)]">{chunks}</span>,
                    })}
                  </h1>
                  <p className="mt-5 max-w-md text-base leading-relaxed text-[#6b6b6b]">{t("indexNewsDescription")}</p>
                  {more.length > 0 ? (
                    <Link
                      href="#all-posts"
                      className="mt-8 inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_12px_28px_-8px_rgba(232,93,4,0.55)] transition hover:bg-[var(--accent-hover)]"
                    >
                      {t("viewAllBlog")}
                    </Link>
                  ) : null}
                </div>

                <div className="lg:col-span-8">
                  <ul className="grid gap-10 md:grid-cols-2 md:gap-8 lg:gap-10">
                    {featured.map((post) => (
                      <li key={post.id}>
                        <BlogNewsCard
                          post={post}
                          href={`/${locale}/blog/${post.slug}`}
                          dateLabel={formatDateLong(post.published_at, locale)}
                          byAuthorLabel={t("byAuthor", { author: post.author_name })}
                          readMoreLabel={t("readMore")}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {more.length > 0 ? (
                <div id="all-posts" className="mt-20 scroll-mt-24 border-t border-black/[0.06] pt-16">
                  <h2 className="mb-10 text-center text-2xl font-extrabold tracking-tight text-[#1a1a1a] sm:text-3xl">
                    {t("moreArticles")}
                  </h2>
                  <ul className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
                    {more.map((post) => (
                      <li key={post.id}>
                        <BlogNewsCard
                          post={post}
                          href={`/${locale}/blog/${post.slug}`}
                          dateLabel={formatDateLong(post.published_at, locale)}
                          byAuthorLabel={t("byAuthor", { author: post.author_name })}
                          readMoreLabel={t("readMore")}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <BlogTemplateAfterPosts locale={locale} />
    </main>
  );
}
