import { unstable_noStore as noStore } from "next/cache";
import { createServerSupabase } from "./supabase";
import { locales } from "@/i18n/routing";

const FALLBACK = { imageUrl: null, headline: null, subtitle: null, cta: null } as const;

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

    const payload = (data?.payload as Record<string, Record<string, string>>) ?? {};
    return {
      imageUrl: data?.image_url ?? null,
      headline: payload.headline?.[safeLocale] ?? null,
      subtitle: payload.subtitle?.[safeLocale] ?? null,
      cta: payload.cta?.[safeLocale] ?? null,
    };
  } catch {
    return FALLBACK;
  }
}
