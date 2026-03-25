import { unstable_noStore as noStore } from "next/cache";
import { createServerSupabase } from "./supabase";
import { locales } from "@/i18n/routing";

const FALLBACK = {
  imageUrl: null,
  headline: null,
  subtitle: null,
  cta: null,
  truckImageUrl: null,
} as const;

export async function getHomepageHero(locale: string) {
  noStore();
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return FALLBACK;
    }
    const safeLocale = locales.includes(locale as (typeof locales)[number]) ? locale : "de";

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("homepage_hero")
      .select("image_url, payload")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("[homepage-hero]", error);
      return FALLBACK;
    }

    const payload = (data?.payload as Record<string, unknown>) ?? {};
    const truckRaw = payload.truckImageUrl;
    const truckImageUrl = typeof truckRaw === "string" && truckRaw.trim() ? truckRaw.trim() : null;

    const hl = payload.headline as Record<string, string> | undefined;
    const st = payload.subtitle as Record<string, string> | undefined;
    const ct = payload.cta as Record<string, string> | undefined;

    return {
      imageUrl: data?.image_url ?? null,
      headline: hl?.[safeLocale] ?? null,
      subtitle: st?.[safeLocale] ?? null,
      cta: ct?.[safeLocale] ?? null,
      truckImageUrl,
    };
  } catch {
    return FALLBACK;
  }
}
