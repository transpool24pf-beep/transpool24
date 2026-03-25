import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { slugifyInput } from "@/lib/blog-slug";
import { locales } from "@/i18n/routing";

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
  let q = supabase.from("blog_pages").select("*").order("nav_order", { ascending: true }).order("title");
  if (locale) q = q.eq("locale", locale);

  const { data, error } = await q;
  if (error) {
    console.error("[admin/blog/pages GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ pages: data ?? [] });
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

  const nav_order =
    typeof body.nav_order === "number" && Number.isFinite(body.nav_order)
      ? Math.round(body.nav_order)
      : 0;

  const row = {
    locale,
    slug,
    title,
    body: typeof body.body === "string" ? body.body : "",
    featured_image_url:
      typeof body.featured_image_url === "string" ? body.featured_image_url.trim() || null : null,
    status,
    published_at,
    meta_title: typeof body.meta_title === "string" ? body.meta_title.trim() || null : null,
    meta_description:
      typeof body.meta_description === "string" ? body.meta_description.trim() || null : null,
    nav_order,
  };

  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("blog_pages").insert(row).select("id").single();
  if (error) {
    console.error("[admin/blog/pages POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateBlogAll();
  revalidatePath(`/${locale}/blog/pages/${slug}`);

  return NextResponse.json({ id: data.id, slug });
}
