import { NextResponse } from "next/server";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";
import { mapSocialRow, type SiteSocialMediaRow } from "@/lib/site-social-media";

function normalizeUrl(s: unknown): string {
  if (typeof s !== "string") return "";
  const t = s.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export async function GET() {
  const err = await requireWebsiteAdmin();
  if (err) return err;
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("site_social_media").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({
        social: {
          instagramUrl: "",
          tiktokUrl: "",
          linkedinUrl: "",
          facebookUrl: "",
          youtubeUrl: "",
        },
      });
    }
    return NextResponse.json({ social: mapSocialRow(data as SiteSocialMediaRow) });
  } catch (e) {
    console.error("[website/content/social-media GET]", e);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;
  try {
    const body = await request.json();
    const instagram_url = normalizeUrl(body.instagramUrl);
    const tiktok_url = normalizeUrl(body.tiktokUrl);
    const linkedin_url = normalizeUrl(body.linkedinUrl);
    const facebook_url = normalizeUrl(body.facebookUrl);
    const youtube_url = normalizeUrl(body.youtubeUrl);

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("site_social_media")
      .upsert(
        {
          id: 1,
          instagram_url,
          tiktok_url,
          linkedin_url,
          facebook_url,
          youtube_url,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ social: mapSocialRow(data as SiteSocialMediaRow) });
  } catch (e) {
    console.error("[website/content/social-media PUT]", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
