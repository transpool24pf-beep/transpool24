import { tryGetSupabase } from "@/lib/supabase";

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

export function slugifyInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function listPublishedPosts(locale: string, limit = 80): Promise<BlogPostCard[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, featured_image_url, category, tags, published_at, author_name"
    )
    .eq("locale", locale)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) {
    console.error("[blog] listPublishedPosts", error);
    return [];
  }
  return (data ?? []) as BlogPostCard[];
}

export async function getPublishedPostBySlug(
  locale: string,
  slug: string
): Promise<BlogPost | null> {
  const sb = tryGetSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("blog_posts")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[blog] getPublishedPostBySlug", error);
    return null;
  }
  if (!data) return null;
  return data as BlogPost;
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
    .maybeSingle();
  if (error) {
    console.error("[blog] getPublishedPageBySlug", error);
    return null;
  }
  if (!data) return null;
  return data as BlogPage;
}
