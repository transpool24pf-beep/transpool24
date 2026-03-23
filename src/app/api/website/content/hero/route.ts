import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { locales } from "@/i18n/routing";
import { translateHeroFromEnglish } from "@/lib/hero-auto-translate";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";

export async function GET() {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("homepage_hero")
      .select("image_url, payload")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    const payload = (data?.payload as Record<string, Record<string, string>>) ?? {};
    return NextResponse.json({
      imageUrl: data?.image_url ?? null,
      headline: payload.headline ?? {},
      subtitle: payload.subtitle ?? {},
      cta: payload.cta ?? {},
    });
  } catch (e) {
    console.error("[website/content/hero GET]", e);
    return NextResponse.json(
      { imageUrl: null, headline: {}, subtitle: {}, cta: {} },
      { status: 200 },
    );
  }
}

export async function PUT(req: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const body = await req.json();
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() || null : null;

    let payload: { headline: Record<string, string>; subtitle: Record<string, string>; cta: Record<string, string> };
    let translationFallback = false;

    const he = body.heroEnglish;
    if (he && typeof he === "object") {
      const headlineEn = typeof he.headline === "string" ? he.headline : "";
      const subtitleEn = typeof he.subtitle === "string" ? he.subtitle : "";
      const ctaEn = typeof he.cta === "string" ? he.cta : "";
      payload = await translateHeroFromEnglish(headlineEn, subtitleEn, ctaEn);
      translationFallback =
        !process.env.DEEPL_AUTH_KEY && !process.env.GOOGLE_TRANSLATE_API_KEY;
    } else {
      const headline = body.headline && typeof body.headline === "object" ? body.headline : {};
      const subtitle = body.subtitle && typeof body.subtitle === "object" ? body.subtitle : {};
      const cta = body.cta && typeof body.cta === "object" ? body.cta : {};
      payload = { headline, subtitle, cta };
    }

    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("homepage_hero")
      .upsert(
        { id: 1, image_url: imageUrl, payload },
        { onConflict: "id" },
      );

    if (error) throw error;

    for (const loc of locales) {
      revalidatePath(`/${loc}`, "page");
    }

    return NextResponse.json({ ok: true, translationFallback });
  } catch (e) {
    console.error("[website/content/hero PUT]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
