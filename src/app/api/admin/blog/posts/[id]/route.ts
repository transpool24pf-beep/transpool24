import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { slugifyInput } from "@/lib/blog-slug";
import { clampPublishedAtIfInFuture } from "@/lib/blog-publish";
import { locales } from "@/i18n/routing";
import { upsertTranslatedPostCopies } from "@/lib/blog-sync-translations";

/** Match POST: auto-translate batches can exceed default Vercel limit. */
export const maxDuration = 120;

function revalidateBlogAll() {
  for (const locale of locales) {
    revalidatePath(`/${locale}/blog`);
  }
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const err = await requireAdmin();
  if (err) return err;

  const { id } = await ctx.params;
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[admin/blog/posts/[id] GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post: data });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const err = await requireAdmin();
  if (err) return err;

  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: existing, error: fetchErr } = await supabase
    .from("blog_posts")
    .select("locale, slug")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const oldSlug = existing.slug as string;
  const oldLocale = existing.locale as string;

  const patch: Record<string, unknown> = {};

  if (typeof body.locale === "string" && locales.includes(body.locale as (typeof locales)[number])) {
    patch.locale = body.locale.trim();
  }
  if (typeof body.slug === "string") {
    const s = slugifyInput(body.slug);
    if (s) patch.slug = s;
  }
  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.excerpt === "string") patch.excerpt = body.excerpt.trim() || null;
  if (typeof body.body === "string") patch.body = body.body;
  if (typeof body.featured_image_url === "string") {
    patch.featured_image_url = body.featured_image_url.trim() || null;
  }
  if (typeof body.category === "string") patch.category = body.category.trim() || null;
  if (Array.isArray(body.tags)) {
    patch.tags = (body.tags as unknown[])
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim());
  } else if (typeof body.tags === "string") {
    patch.tags = body.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  if (body.status === "draft" || body.status === "published") {
    patch.status = body.status;
  }
  if (typeof body.published_at === "string") {
    patch.published_at = body.published_at.trim() || null;
  }
  if (typeof body.meta_title === "string") patch.meta_title = body.meta_title.trim() || null;
  if (typeof body.meta_description === "string") {
    patch.meta_description = body.meta_description.trim() || null;
  }
  if (typeof body.author_name === "string" && body.author_name.trim()) {
    patch.author_name = body.author_name.trim();
  }

  if (patch.status === "published" && patch.published_at === undefined) {
    const { data: cur } = await supabase
      .from("blog_posts")
      .select("published_at, status")
      .eq("id", id)
      .single();
    if (cur && cur.status !== "published" && !cur.published_at) {
      patch.published_at = new Date().toISOString();
    }
  }
  if (patch.status === "draft" && body.published_at === null) {
    patch.published_at = null;
  }

  const { data: curPub } = await supabase
    .from("blog_posts")
    .select("status, published_at")
    .eq("id", id)
    .single();
  const mergedStatus = (patch.status as string | undefined) ?? curPub?.status ?? "draft";
  const mergedPublishedAt =
    patch.published_at !== undefined ? (patch.published_at as string | null) : curPub?.published_at ?? null;
  if (mergedStatus === "published") {
    patch.published_at = clampPublishedAtIfInFuture(mergedPublishedAt, "published");
  }

  const { data, error } = await supabase.from("blog_posts").update(patch).eq("id", id).select("*").single();
  if (error) {
    console.error("[admin/blog/posts/[id] PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const autoTranslate =
    body.auto_translate_all !== false && body.auto_translate_all !== "false";
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const { translatedLocales, translationNote } = await upsertTranslatedPostCopies(
    supabase,
    {
      locale: data.locale as string,
      slug: data.slug as string,
      title: data.title as string,
      excerpt: (data.excerpt as string | null) ?? null,
      body: (data.body as string) ?? "",
      featured_image_url: (data.featured_image_url as string | null) ?? null,
      category: (data.category as string | null) ?? null,
      tags: (data.tags as string[]) ?? [],
      status: data.status as string,
      published_at: (data.published_at as string | null) ?? null,
      meta_title: (data.meta_title as string | null) ?? null,
      meta_description: (data.meta_description as string | null) ?? null,
      author_name: (data.author_name as string) || "TransPool24",
    },
    autoTranslate,
    openaiKey
  );

  revalidateBlogAll();
  revalidatePath(`/${oldLocale}/blog/${oldSlug}`);
  const newLocale = (data.locale as string) || oldLocale;
  const newSlug = (data.slug as string) || oldSlug;
  revalidatePath(`/${newLocale}/blog/${newSlug}`);
  for (const loc of translatedLocales) {
    revalidatePath(`/${loc}/blog/${newSlug}`);
  }

  return NextResponse.json({
    post: data,
    translatedLocales,
    ...(translationNote ? { translationNote } : {}),
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const err = await requireAdmin();
  if (err) return err;

  const { id } = await ctx.params;
  const supabase = createServerSupabase();
  const { data: existing } = await supabase.from("blog_posts").select("locale, slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) {
    console.error("[admin/blog/posts/[id] DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateBlogAll();
  if (existing) {
    revalidatePath(`/${existing.locale}/blog/${existing.slug}`);
  }

  return NextResponse.json({ ok: true });
}
