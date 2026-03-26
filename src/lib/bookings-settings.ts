import { createServerSupabase } from "./supabase";

const BOOKINGS_KEY = "bookings";

export type BookingsSettings = {
  paused: boolean;
};

const DEFAULT: BookingsSettings = { paused: false };

export async function getBookingsSettings(): Promise<BookingsSettings> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.from("settings").select("value").eq("key", BOOKINGS_KEY).maybeSingle();
    if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
      const v = data.value as Record<string, unknown>;
      return { paused: Boolean(v.paused) };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT;
}
