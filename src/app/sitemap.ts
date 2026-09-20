import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/i18n/routing";
import { listLocalesWithNativeBlogPosts, listPublishedPostsForSitemap } from "@/lib/blog";
import { getPublicSiteUrl } from "@/lib/public-site-url";

const STATIC_SUFFIXES = ["", "/why", "/driver", "/privacy", "/terms", "/support"] as const;

/** Real content date for static locale pages — do not use `new Date()` per request. */
const STATIC_LASTMOD = new Date("2026-09-20T18:00:00.000Z");

function safeLastmod(value: string | Date | undefined): Date {
  if (!value) return STATIC_LASTMOD;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return STATIC_LASTMOD;
  return d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getPublicSiteUrl();
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  const push = (
    path: string,
    extra?: Pick<MetadataRoute.Sitemap[number], "lastModified" | "changeFrequency" | "priority">,
  ) => {
    const url = `${site}${path}`;
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({
      url,
      lastModified: safeLastmod(extra?.lastModified),
      changeFrequency: extra?.changeFrequency ?? "weekly",
      priority: extra?.priority ?? 0.7,
    });
  };

  for (const loc of locales) {
    for (const suffix of STATIC_SUFFIXES) {
      const path = `/${loc}${suffix}`;
      const isHome = suffix === "";
      push(path, {
        lastModified: STATIC_LASTMOD,
        changeFrequency: "weekly",
        priority: isHome && (loc === "de" || loc === "ar") ? 1 : isHome ? 0.9 : 0.7,
      });
    }
  }

  try {
    const nativeBlogLocales = await listLocalesWithNativeBlogPosts();
    const blogLocales = nativeBlogLocales.length > 0 ? nativeBlogLocales : [defaultLocale];
    for (const loc of blogLocales) {
      push(`/${loc}/blog`, { lastModified: STATIC_LASTMOD, changeFrequency: "weekly", priority: 0.65 });
    }

    const posts = await listPublishedPostsForSitemap();
    for (const post of posts) {
      push(`/${post.locale}/blog/${post.slug}`, {
        lastModified: post.lastModified,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (e) {
    console.error("[sitemap] blog entries skipped", e);
    push(`/${defaultLocale}/blog`, { lastModified: STATIC_LASTMOD, changeFrequency: "weekly", priority: 0.65 });
  }

  return entries;
}
