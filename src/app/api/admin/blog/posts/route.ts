import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { slugifyInput } from "@/lib/blog";
import { locales, type Locale } from "@/i18n/routing";
import { otherLocalesThan, translatePostIntoLocales } from "@/lib/blog-translate";

/** Auto-translate can take a while (multiple OpenAI batches). Raise on Vercel if needed. */
export const maxDuration = 120;

function revalidateBlogAll() {
  for (const locale of locales) {
    revalidatePath(`/${locale}/blog`);
  }
}

export async function GET(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale")?.trim();

  const supabase = createServerSupabase();
  let q = supabase.from("blog_posts").select("*").order("updated_at", { ascending: false });
  if (locale) q = q.eq("locale", locale);

  const { data, error } = await q;
  if (error) {
    console.error("[admin/blog/posts GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const locale = typeof body.locale === "string" ? body.locale.trim() : "";
  let slug = typeof body.slug === "string" ? slugifyInput(body.slug) : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!locales.includes(locale as (typeof locales)[number]) || !title) {
    return NextResponse.json({ error: "locale and title are required" }, { status: 400 });
  }
  if (!slug) slug = slugifyInput(title);
  if (!slug) {
    return NextResponse.json({ error: "slug could not be derived; set slug manually (Latin)" }, { status: 400 });
  }

  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[]).filter((t): t is string => typeof t === "string").map((t) => t.trim())
    : typeof body.tags === "string"
      ? body.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [];

  let status = body.status === "published" ? "published" : "draft";
  let published_at =
    typeof body.published_at === "string" && body.published_at.trim()
      ? body.published_at.trim()
      : null;
  if (status === "published" && !published_at) {
    published_at = new Date().toISOString();
  }
  if (status === "draft") {
    published_at = typeof body.published_at === "string" ? body.published_at.trim() || null : null;
  }

  const row = {
    locale,
    slug,
    title,
    excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() || null : null,
    body: typeof body.body === "string" ? body.body : "",
    featured_image_url:
      typeof body.featured_image_url === "string" ? body.featured_image_url.trim() || null : null,
    category: typeof body.category === "string" ? body.category.trim() || null : null,
    tags,
    status,
    published_at,
    meta_title: typeof body.meta_title === "string" ? body.meta_title.trim() || null : null,
    meta_description:
      typeof body.meta_description === "string" ? body.meta_description.trim() || null : null,
    author_name:
      typeof body.author_name === "string" && body.author_name.trim()
        ? body.author_name.trim()
        : "TransPool24",
  };

  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("blog_posts").insert(row).select("id").single();
  if (error) {
    console.error("[admin/blog/posts POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const autoTranslate =
    body.auto_translate_all !== false && body.auto_translate_all !== "false";
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const translatedLocales: string[] = [];
  let translationNote: string | undefined;

  if (autoTranslate && openaiKey) {
    const targets = otherLocalesThan(locale as Locale);
    try {
      const translations = await translatePostIntoLocales(
        {
          title: row.title,
          excerpt: row.excerpt,
          body: row.body,
          meta_title: row.meta_title,
          meta_description: row.meta_description,
          category: row.category,
          tags: row.tags,
        },
        locale as Locale,
        targets,
        openaiKey
      );

      for (const loc of targets) {
        const tr = translations[loc];
        if (!tr) continue;
        const satellite = {
          locale: loc,
          slug,
          title: tr.title,
          excerpt: tr.excerpt,
          body: tr.body,
          featured_image_url: row.featured_image_url,
          category: tr.category,
          tags: tr.tags,
          status: row.status,
          published_at: row.published_at,
          meta_title: tr.meta_title,
          meta_description: tr.meta_description,
          author_name: row.author_name,
        };
        const { error: upErr } = await supabase.from("blog_posts").upsert(satellite, {
          onConflict: "locale,slug",
        });
        if (!upErr) translatedLocales.push(loc);
        else console.error("[admin/blog/posts translate upsert]", loc, upErr);
      }
    } catch (e) {
      console.error("[admin/blog/posts translate]", e);
      translationNote = "Auto-translate failed; primary post was saved.";
    }
  } else if (autoTranslate && !openaiKey) {
    translationNote =
      "Auto-translate skipped: set OPENAI_API_KEY in Vercel (or .env) to publish in all languages at once.";
  }

  revalidateBlogAll();
  revalidatePath(`/${locale}/blog/${slug}`);
  for (const loc of translatedLocales) {
    revalidatePath(`/${loc}/blog/${slug}`);
  }

  return NextResponse.json({
    id: data.id,
    slug,
    translatedLocales,
    ...(translationNote ? { translationNote } : {}),
  });
}
