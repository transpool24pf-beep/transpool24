import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/i18n/routing";
import { listLocalesWithNativeBlogPosts, listPublishedPostsForSitemap } from "@/lib/blog";
import { getPublicSiteUrl } from "@/lib/public-site-url";

const STATIC_SUFFIXES = ["", "/why", "/driver", "/privacy", "/terms", "/support"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getPublicSiteUrl();
  const lastModified = new Date();
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
      lastModified: extra?.lastModified ?? lastModified,
      changeFrequency: extra?.changeFrequency ?? "weekly",
      priority: extra?.priority ?? 0.7,
    });
  };

  for (const loc of locales) {
    for (const suffix of STATIC_SUFFIXES) {
      const path = `/${loc}${suffix}`;
      const isHome = suffix === "";
      push(path, {
        lastModified,
        changeFrequency: "weekly",
        priority: isHome && (loc === "de" || loc === "ar") ? 1 : isHome ? 0.9 : 0.7,
      });
    }
  }

  const nativeBlogLocales = await listLocalesWithNativeBlogPosts();
  const blogLocales = nativeBlogLocales.length > 0 ? nativeBlogLocales : [defaultLocale];
  for (const loc of blogLocales) {
    push(`/${loc}/blog`, { lastModified, changeFrequency: "weekly", priority: 0.65 });
  }

  const posts = await listPublishedPostsForSitemap();
  for (const post of posts) {
    push(`/${post.locale}/blog/${post.slug}`, {
      lastModified: post.lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
