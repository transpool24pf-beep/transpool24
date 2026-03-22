import { getSupabase } from "@/lib/supabase";
import { defaultWhyPayloadForLocale } from "@/lib/why-transpool24-defaults";
import {
  isValidWhyPayload,
  WHY_PAGE_CONTENT_REVISION,
  type WhyPagePayload,
} from "@/lib/why-transpool24-types";
import { normalizeWhyAssetUrl } from "@/lib/why-asset-url";

function dbPayloadRevision(p: WhyPagePayload): number {
  return typeof p.contentRevision === "number" && Number.isFinite(p.contentRevision)
    ? p.contentRevision
    : 0;
}

function normalizeWhyPayloadMedia(p: WhyPagePayload): WhyPagePayload {
  return {
    ...p,
    heroImageUrl: normalizeWhyAssetUrl(p.heroImageUrl),
    sceneImageUrl: normalizeWhyAssetUrl(p.sceneImageUrl),
    howVideoUrl: typeof p.howVideoUrl === "string" ? p.howVideoUrl.trim() : "",
  };
}

export async function getWhyPagePayload(locale: string): Promise<WhyPagePayload> {
  const base = normalizeWhyPayloadMedia(defaultWhyPayloadForLocale(locale));
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("why_transpool24_locale")
      .select("payload")
      .eq("locale", locale)
      .maybeSingle();
    if (error || !data?.payload) return base;
    if (isValidWhyPayload(data.payload)) {
      const fromDb = data.payload as WhyPagePayload;
      // Old CMS rows (no / low revision) must not override new in-repo B2B defaults
      if (dbPayloadRevision(fromDb) < WHY_PAGE_CONTENT_REVISION) {
        return base;
      }
      return normalizeWhyPayloadMedia({ ...base, ...fromDb });
    }
  } catch {
    /* missing table or env in dev */
  }
  return base;
}
