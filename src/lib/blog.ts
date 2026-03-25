import { createHash } from "crypto";
import { unstable_cache } from "next/cache";
import { locales, routing, type Locale } from "@/i18n/routing";
import { tryGetSupabase } from "@/lib/supabase";
import {
  translateBlogCardFields,
  translatePostIntoLocales,
  type BlogCardSourceFields,
  type SourcePostFields,
} from "@/lib/blog-translate";

export type BlogPost = {
  id: string;
  locale: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  featured_image_url: string | null;
  category: string | null;
  tags: string[];
  status: "draft" | "published";
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  author_name: string;
  created_at: string;
  updated_at: string;
};

export type BlogPage = {
  id: string;
  locale: string;
  slug: string;
  title: string;
  body: string;
  featured_image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  nav_order: number;
  created_at: string;
  updated_at: string;
};

export type BlogPostCard = Pick<
  BlogPost,
  "id" | "slug" | "title" | "excerpt" | "featured_image_url" | "category" | "tags" | "published_at" | "author_name"
>;

type CardRow = BlogPostCard & { locale: string; updated_at: string };

const runCachedBlogCardTranslate = unstable_cache(
  async (sourceLocale: string, targetLocale: string, fingerprint: string, cardJson: string) => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return null;
    const card = JSON.parse(cardJson) as BlogCardSourceFields;
    return translateBlogCardFields(card, sourceLocale as Locale, targetLocale as Locale, apiKey);
  },
  ["blog-list-card-translate"],
  { revalidate: 86_400 }
);

const runCachedBlogFullTranslate = unstable_cache(
  async (sourceLocale: string, targetLocale: string, fingerprint: string, fieldsJson: string) => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return null;
    const fields = JSON.parse(fieldsJson) as SourcePostFields;
    const out = await translatePostIntoLocales(
      fields,
      sourceLocale as Locale,
      [targetLocale as Locale],
      apiKey
    );
    return out[targetLocale as Locale] ?? null;
  },
  ["blog-article-full-translate"],
  { revalidate: 86_400 }
);

function pickTranslationSource<T extends { locale: string }>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  const byLoc = new Map(rows.map((r) => [r.locale, r]));
  const d = routing.defaultLocale;
  if (byLoc.has(d)) return byLoc.get(d)!;
  for (const loc of locales) {
    if (byLoc.has(loc)) return byLoc.get(loc)!;
  }
  return rows[0];
}

function cardFingerprint(
  r: Pick<CardRow, "title" | "excerpt" | "category" | "tags" | "updated_at">
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        t: r.title,
        e: r.excerpt,
        c: r.category,
        g: r.tags,
        u: r.updated_at,
      })
    )
    .digest("hex")
    .slice(0, 24);
}

function toCard(r: CardRow): BlogPostCard {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    featured_image_url: r.featured_image_url,
    category: r.category,
    tags: r.tags,
    published_at: r.published_at,
    author_name: r.author_name,
  };
}

async function cachedTranslateCard(
  source: CardRow,
  targetLocale: Locale
): Promise<BlogPostCard | null> {
  if (source.locale === targetLocale) return toCard(source);

  const fp = cardFingerprint(source);
  const cardJson = JSON.stringify({
    title: source.title,
    excerpt: source.excerpt,
    category: source.category,
    tags: source.tags,
  } satisfies BlogCardSourceFields);

  const tr = await runCachedBlogCardTranslate(source.locale, targetLocale, fp, cardJson);
  if (!tr) return null;

  return {
    id: source.id,
    slug: source.slug,
    title: tr.title,
    excerpt: tr.excerpt,
    featured_image_url: source.featured_image_url,
    category: tr.category,
    tags: tr.tags,
    published_at: source.published_at,
    author_name: source.author_name,
  };
}

function sourceFieldsFromPost(p: BlogPost): SourcePostFields {
  return {
    title: p.title,
    excerpt: p.excerpt,
    body: p.body,
    meta_title: p.meta_title,
    meta_description: p.meta_description,
    category: p.category,
    tags: p.tags,
  };
}

async function cachedTranslateFullPost(
  source: BlogPost,
  targetLocale: Locale
): Promise<BlogPost | null> {
  if (source.locale === targetLocale) return null;

  const fp = createHash("sha256")
    .update(
      JSON.stringify({
        ...sourceFieldsFromPost(source),
        u: source.updated_at,
      })
    )
    .digest("hex")
    .slice(0, 32);

  const fieldsJson = JSON.stringify(sourceFieldsFromPost(source));
  const tr = await runCachedBlogFullTranslate(source.locale, targetLocale, fp, fieldsJson);
  if (!tr) return null;
  return {
    ...source,
    locale: targetLocale,
    title: tr.title,
    excerpt: tr.excerpt,
    body: tr.body,
    meta_title: tr.meta_title,
    meta_description: tr.meta_description,
    category: tr.category,
    tags: tr.tags,
  };
}

/**
 * Published posts grouped by slug; missing locale rows are filled via cached KI translation when OPENAI_API_KEY is set.
 */
export async function listPublishedPosts(locale: string, limit = 80): Promise<BlogPostCard[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const loc = locale as Locale;
  if (!locales.includes(loc)) return [];

  const { data, error } = await sb
    .from("blog_posts")
    .select(
      "id, locale, slug, title, excerpt, featured_image_url, category, tags, published_at, author_name, updated_at"
    )
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(800);

  if (error) {
    console.error("[blog] listPublishedPosts", error);
    return [];
  }

  const rows = (data ?? []) as CardRow[];
  const bySlug = new Map<string, CardRow[]>();
  for (const r of rows) {
    const g = bySlug.get(r.slug) ?? [];
    g.push(r);
    bySlug.set(r.slug, g);
  }

  const slugOrder = [...bySlug.entries()].sort((a, b) => {
    const maxA = Math.max(...a[1].map((x) => new Date(x.published_at ?? 0).getTime()));
    const maxB = Math.max(...b[1].map((x) => new Date(x.published_at ?? 0).getTime()));
    return maxB - maxA;
  });

  const out: BlogPostCard[] = [];
  for (const [, group] of slugOrder) {
    if (out.length >= limit) break;
    const direct = group.find((r) => r.locale === loc);
    if (direct) {
      out.push(toCard(direct));
      continue;
    }
    const source = pickTranslationSource(group);
    if (!source) continue;
    try {
      const card = await cachedTranslateCard(source, loc);
      if (card) out.push(card);
    } catch (e) {
      console.error("[blog] listPublishedPosts translate", e);
    }
  }

  return out;
}

export async function getPublishedPostBySlug(
  locale: string,
  slug: string
): Promise<BlogPost | null> {
  const sb = tryGetSupabase();
  if (!sb) return null;
  const loc = locale as Locale;
  if (!locales.includes(loc)) return null;

  const { data, error } = await sb
    .from("blog_posts")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .not("published_at", "is", null)
    .maybeSingle();
  if (error) {
    console.error("[blog] getPublishedPostBySlug", error);
    return null;
  }
  if (data) return data as BlogPost;

  const { data: siblings, error: sErr } = await sb
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .not("published_at", "is", null);
  if (sErr) {
    console.error("[blog] getPublishedPostBySlug siblings", sErr);
    return null;
  }
  const group = (siblings ?? []) as BlogPost[];
  const source = pickTranslationSource(group);
  if (!source) return null;

  try {
    const translated = await cachedTranslateFullPost(source, loc);
    if (translated) return translated;
  } catch (e) {
    console.error("[blog] getPublishedPostBySlug translate", e);
  }

  // Avoid showing Arabic (etc.) body on /de/blog when OPENAI failed or key is missing.
  return null;
}

export async function listPublishedPagesNav(locale: string): Promise<
  Pick<BlogPage, "slug" | "title" | "nav_order">[]
> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("blog_pages")
    .select("slug, title, nav_order")
    .eq("locale", locale)
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("nav_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) {
    console.error("[blog] listPublishedPagesNav", error);
    return [];
  }
  return (data ?? []) as Pick<BlogPage, "slug" | "title" | "nav_order">[];
}

export async function getPublishedPageBySlug(
  locale: string,
  slug: string
): Promise<BlogPage | null> {
  const sb = tryGetSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("blog_pages")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .not("published_at", "is", null)
    .maybeSingle();
  if (error) {
    console.error("[blog] getPublishedPageBySlug", error);
    return null;
  }
  if (!data) return null;
  return data as BlogPage;
}
