import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-api";
import { slugifyInput } from "@/lib/blog";
import { locales } from "@/i18n/routing";

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
  const { data, error } = await supabase.from("blog_pages").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[admin/blog/pages/[id] GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ page: data });
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
    .from("blog_pages")
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
  if (typeof body.body === "string") patch.body = body.body;
  if (typeof body.featured_image_url === "string") {
    patch.featured_image_url = body.featured_image_url.trim() || null;
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
  if (typeof body.nav_order === "number" && Number.isFinite(body.nav_order)) {
    patch.nav_order = Math.round(body.nav_order);
  }

  if (patch.status === "published" && patch.published_at === undefined) {
    const { data: cur } = await supabase
      .from("blog_pages")
      .select("published_at, status")
      .eq("id", id)
      .single();
    if (cur && cur.status !== "published" && !cur.published_at) {
      patch.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase.from("blog_pages").update(patch).eq("id", id).select("*").single();
  if (error) {
    console.error("[admin/blog/pages/[id] PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateBlogAll();
  revalidatePath(`/${oldLocale}/blog/pages/${oldSlug}`);
  const newLocale = (data.locale as string) || oldLocale;
  const newSlug = (data.slug as string) || oldSlug;
  revalidatePath(`/${newLocale}/blog/pages/${newSlug}`);

  return NextResponse.json({ page: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const err = await requireAdmin();
  if (err) return err;

  const { id } = await ctx.params;
  const supabase = createServerSupabase();
  const { data: existing } = await supabase.from("blog_pages").select("locale, slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("blog_pages").delete().eq("id", id);
  if (error) {
    console.error("[admin/blog/pages/[id] DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateBlogAll();
  if (existing) {
    revalidatePath(`/${existing.locale}/blog/pages/${existing.slug}`);
  }

  return NextResponse.json({ ok: true });
}
