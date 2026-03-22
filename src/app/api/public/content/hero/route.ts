import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { locales } from "@/i18n/routing";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") ?? "de";
    const safeLocale = locales.includes(locale as (typeof locales)[number]) ? locale : "de";

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("homepage_hero")
      .select("image_url, payload")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    const row = data;
    const payload = (row?.payload as Record<string, Record<string, string>>) ?? {};
    const headline = payload.headline?.[safeLocale] ?? null;
    const subtitle = payload.subtitle?.[safeLocale] ?? null;
    const cta = payload.cta?.[safeLocale] ?? null;

    return NextResponse.json({
      imageUrl: row?.image_url ?? null,
      headline,
      subtitle,
      cta,
    });
  } catch (e) {
    console.error("[public/content/hero GET]", e);
    return NextResponse.json(
      { imageUrl: null, headline: null, subtitle: null, cta: null },
      { status: 200 },
    );
  }
}
