import { NextResponse } from "next/server";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";
import { getWhyPagePayload } from "@/lib/get-why-page-payload";
import { defaultWhyPayloadForLocale } from "@/lib/why-transpool24-defaults";
import { isValidWhyPayload } from "@/lib/why-transpool24-types";
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
    if (!isValidWhyPayload(body.payload)) {
      return NextResponse.json({ error: "Invalid payload shape" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { error } = await supabase.from("why_transpool24_locale").upsert(
      {
        locale,
        payload: body.payload,
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
