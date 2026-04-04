import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { createServerSupabase } from "@/lib/supabase";

function normalizeUrl(s: unknown): string {
  if (typeof s !== "string") return "";
  const t = s.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function normalizeEmailField(s: unknown, fallback: string): string {
  if (typeof s !== "string") return fallback;
  const t = s.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return fallback;
  return t;
}

const DEFAULT_PRIMARY = "transpool24pf@gmail.com";
const DEFAULT_SECONDARY = "transpool24@hotmail.com";

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("site_social_media").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({
        instagramUrl: "",
        tiktokUrl: "",
        linkedinUrl: "",
        emailPrimary: DEFAULT_PRIMARY,
        emailSecondary: DEFAULT_SECONDARY,
      });
    }
    const row = data as Record<string, unknown>;
    return NextResponse.json({
      instagramUrl: String(row.instagram_url ?? "").trim(),
      tiktokUrl: String(row.tiktok_url ?? "").trim(),
      linkedinUrl: String(row.linkedin_url ?? "").trim(),
      emailPrimary: normalizeEmailField(row.email_footer_email_primary, DEFAULT_PRIMARY),
      emailSecondary: normalizeEmailField(row.email_footer_email_secondary, DEFAULT_SECONDARY),
    });
  } catch (e) {
    console.error("[admin/email-social GET]", e);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const instagram_url = normalizeUrl(body.instagramUrl);
    const tiktok_url = normalizeUrl(body.tiktokUrl);
    const linkedin_url = normalizeUrl(body.linkedinUrl);
    const email_footer_email_primary = normalizeEmailField(
      body.emailPrimary,
      DEFAULT_PRIMARY,
    );
    const email_footer_email_secondary = normalizeEmailField(
      body.emailSecondary,
      DEFAULT_SECONDARY,
    );

    const supabase = createServerSupabase();
    const { data: exists } = await supabase.from("site_social_media").select("id").eq("id", 1).maybeSingle();
    if (!exists) {
      return NextResponse.json(
        { error: "site_social_media row missing — run supabase/site_social_media.sql" },
        { status: 500 },
      );
    }

    const { error } = await supabase
      .from("site_social_media")
      .update({
        instagram_url,
        tiktok_url,
        linkedin_url,
        email_footer_email_primary,
        email_footer_email_secondary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      if (error.message?.includes("email_footer_email") || error.code === "42703") {
        return NextResponse.json(
          {
            error:
              "Database columns missing — run supabase/site_social_media_email_footer.sql in Supabase SQL Editor",
          },
          { status: 500 },
        );
      }
      throw error;
    }

    return NextResponse.json({
      instagramUrl: instagram_url,
      tiktokUrl: tiktok_url,
      linkedinUrl: linkedin_url,
      emailPrimary: email_footer_email_primary,
      emailSecondary: email_footer_email_secondary,
    });
  } catch (e) {
    console.error("[admin/email-social PUT]", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
