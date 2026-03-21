import { NextResponse } from "next/server";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";
import { getWhyPagePayload } from "@/lib/get-why-page-payload";
import { defaultWhyPayloadForLocale } from "@/lib/why-transpool24-defaults";
import { isValidWhyPayload, type WhyPagePayload } from "@/lib/why-transpool24-types";
import { normalizeWhyAssetUrl } from "@/lib/why-asset-url";
import { locales } from "@/i18n/routing";

export async function GET(request: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  const locale = new URL(request.url).searchParams.get("locale") || "de";
  if (!locales.includes(locale as (typeof locales)[number])) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  try {
    const payload = await getWhyPagePayload(locale);
    return NextResponse.json({ locale, payload });
  } catch (e) {
    console.error("[website/why-transpool24 GET]", e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const body = await request.json();
    const locale = typeof body.locale === "string" ? body.locale : "";
    if (!locales.includes(locale as (typeof locales)[number])) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }
    const base = defaultWhyPayloadForLocale(locale);
    const merged = { ...base, ...(body.payload as object) } as WhyPagePayload;
    if (!isValidWhyPayload(merged)) {
      return NextResponse.json({ error: "Invalid payload shape" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { error } = await supabase.from("why_transpool24_locale").upsert(
      {
        locale,
        payload: merged,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "locale" },
    );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[website/why-transpool24 PUT]", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

/** Partial update: hero image, scene/poster image, how-section video URL */
export async function PATCH(request: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const body = await request.json();
    const locale = typeof body.locale === "string" ? body.locale : "";
    if (!locales.includes(locale as (typeof locales)[number])) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const current = await getWhyPagePayload(locale);
    const next = { ...current };
    if (typeof body.heroImageUrl === "string") next.heroImageUrl = normalizeWhyAssetUrl(body.heroImageUrl);
    if (typeof body.sceneImageUrl === "string") next.sceneImageUrl = normalizeWhyAssetUrl(body.sceneImageUrl);
    if (typeof body.howVideoUrl === "string") next.howVideoUrl = body.howVideoUrl.trim();

    if (!isValidWhyPayload(next)) {
      return NextResponse.json({ error: "Invalid payload after merge" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { error } = await supabase.from("why_transpool24_locale").upsert(
      {
        locale,
        payload: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "locale" },
    );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[website/why-transpool24 PATCH]", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

/** Code defaults only (reset template in CMS) */
export async function DELETE(request: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  const locale = new URL(request.url).searchParams.get("locale") || "de";
  if (!locales.includes(locale as (typeof locales)[number])) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  try {
    const supabase = createServerSupabase();
    const { error } = await supabase.from("why_transpool24_locale").delete().eq("locale", locale);
    if (error) throw error;
    const payload = defaultWhyPayloadForLocale(locale);
    return NextResponse.json({ success: true, payload });
  } catch (e) {
    console.error("[website/why-transpool24 DELETE]", e);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
