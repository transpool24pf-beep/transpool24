import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { EMPTY_SOCIAL, mapSocialRow, type SiteSocialMediaRow } from "@/lib/site-social-media";

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("site_social_media").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ social: EMPTY_SOCIAL });
    return NextResponse.json({ social: mapSocialRow(data as SiteSocialMediaRow) });
  } catch (e) {
    console.error("[public/social-media GET]", e);
    return NextResponse.json({ social: EMPTY_SOCIAL }, { status: 200 });
  }
}
