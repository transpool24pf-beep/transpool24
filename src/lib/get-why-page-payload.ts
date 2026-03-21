import { getSupabase } from "@/lib/supabase";
import { defaultWhyPayloadForLocale } from "@/lib/why-transpool24-defaults";
import { isValidWhyPayload, type WhyPagePayload } from "@/lib/why-transpool24-types";

export async function getWhyPagePayload(locale: string): Promise<WhyPagePayload> {
  const base = defaultWhyPayloadForLocale(locale);
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("why_transpool24_locale")
      .select("payload")
      .eq("locale", locale)
      .maybeSingle();
    if (error || !data?.payload) return base;
    if (isValidWhyPayload(data.payload)) return data.payload as WhyPagePayload;
  } catch {
    /* missing table or env in dev */
  }
  return base;
}
