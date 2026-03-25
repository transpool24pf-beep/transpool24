import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/i18n/routing";
import { otherLocalesThan, translatePostIntoLocales } from "@/lib/blog-translate";

export type BlogPostUpsertSource = {
  locale: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  featured_image_url: string | null;
  category: string | null;
  tags: string[];
  status: string;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  author_name: string;
};

/**
 * Creates or updates translated rows for every site locale (same slug) via OpenAI.
 * Used after creating or editing the primary post.
 */
export async function upsertTranslatedPostCopies(
  supabase: SupabaseClient,
  row: BlogPostUpsertSource,
  autoTranslate: boolean,
  openaiKey: string | undefined
): Promise<{ translatedLocales: string[]; translationNote?: string }> {
  const translatedLocales: string[] = [];
  let translationNote: string | undefined;

  if (!autoTranslate) {
    return { translatedLocales };
  }
  if (!openaiKey) {
    translationNote =
      "Auto-translate skipped: set OPENAI_API_KEY in Vercel (or .env) to publish in all languages at once.";
    return { translatedLocales, translationNote };
  }

  const targets = otherLocalesThan(row.locale as Locale);
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
      row.locale as Locale,
      targets,
      openaiKey
    );

    for (const loc of targets) {
      const tr = translations[loc];
      if (!tr) continue;
      const satellite = {
        locale: loc,
        slug: row.slug,
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
      else console.error("[blog-sync-translations] upsert", loc, upErr);
    }
  } catch (e) {
    console.error("[blog-sync-translations]", e);
    translationNote = "Auto-translate failed; primary post was saved.";
  }

  return { translatedLocales, translationNote };
}
