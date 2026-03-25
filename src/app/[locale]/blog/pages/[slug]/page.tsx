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
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav className="mb-8 text-sm">
        <Link href={`/${locale}/blog`} className="font-medium text-[var(--accent)] hover:underline">
          ← {t("backToMagazine")}
        </Link>
      </nav>

      <article>
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#0d2137] sm:text-4xl">{page.title}</h1>
        </header>

        {page.featured_image_url ? (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl bg-[#0d2137]/[0.06]">
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
