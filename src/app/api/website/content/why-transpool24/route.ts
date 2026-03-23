import { NextResponse } from "next/server";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";
import { getWhyPagePayload } from "@/lib/get-why-page-payload";
import { defaultWhyPayloadForLocale } from "@/lib/why-transpool24-defaults";
import {
  isValidWhyPayload,
  WHY_PAGE_CONTENT_REVISION,
  type WhyPagePayload,
} from "@/lib/why-transpool24-types";
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

    const applyToAllLocales = body.applyToAllLocales === true;
    const targetLocales = applyToAllLocales ? [...locales] : [locale as (typeof locales)[number]];

    const supabase = createServerSupabase();

    for (const loc of targetLocales) {
      const base = defaultWhyPayloadForLocale(loc);
      const merged = {
        ...base,
        ...(body.payload as object),
        contentRevision: WHY_PAGE_CONTENT_REVISION,
      } as WhyPagePayload;
      if (!isValidWhyPayload(merged)) {
        return NextResponse.json(
          { error: `Invalid payload shape (locale ${loc})` },
          { status: 400 },
        );
      }

      const { error } = await supabase.from("why_transpool24_locale").upsert(
        {
          locale: loc,
          payload: merged,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "locale" },
      );

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      applyToAllLocales,
      localesUpdated: targetLocales,
    });
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

    const applyToAllLocales = body.applyToAllLocales === true;
    const targetLocales = applyToAllLocales ? [...locales] : [locale as (typeof locales)[number]];

    const patchHero = typeof body.heroImageUrl === "string";
    const patchScene = typeof body.sceneImageUrl === "string";
    const patchVideo = typeof body.howVideoUrl === "string";
    if (!patchHero && !patchScene && !patchVideo) {
      return NextResponse.json(
        { error: "Provide at least one of heroImageUrl, sceneImageUrl, howVideoUrl" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabase();

    for (const loc of targetLocales) {
      const current = await getWhyPagePayload(loc);
      const next = { ...current, contentRevision: WHY_PAGE_CONTENT_REVISION };
      if (patchHero) next.heroImageUrl = normalizeWhyAssetUrl(body.heroImageUrl);
      if (patchScene) next.sceneImageUrl = normalizeWhyAssetUrl(body.sceneImageUrl);
      if (patchVideo) next.howVideoUrl = body.howVideoUrl.trim();

      if (!isValidWhyPayload(next)) {
        return NextResponse.json(
          { error: `Invalid payload after merge for locale ${loc}` },
          { status: 400 },
        );
      }

      const { error } = await supabase.from("why_transpool24_locale").upsert(
        {
          locale: loc,
          payload: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "locale" },
      );

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      applyToAllLocales,
      localesUpdated: targetLocales,
    });
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
