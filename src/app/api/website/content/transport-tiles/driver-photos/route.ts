import { NextResponse } from "next/server";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";
import { createServerSupabase } from "@/lib/supabase";

type PhotoItem = {
  name: string;
  photoUrl: string;
  source: "homepage" | "approved";
  driverNumber?: number | null;
};

/**
 * Photos already on the site: homepage CMS drivers + approved driver applications.
 */
export async function GET() {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const supabase = createServerSupabase();
    const photos: PhotoItem[] = [];
    const seen = new Set<string>();

    const add = (item: PhotoItem) => {
      const url = item.photoUrl.trim();
      if (!url || seen.has(url)) return;
      seen.add(url);
      photos.push({ ...item, photoUrl: url });
    };

    const { data: homepage } = await supabase
      .from("homepage_drivers")
      .select("name, photo, order")
      .order("order", { ascending: true });

    for (const row of homepage || []) {
      const r = row as { name?: string | null; photo?: string | null };
      add({
        name: (r.name ?? "").trim() || "Fahrer",
        photoUrl: (r.photo ?? "").trim(),
        source: "homepage",
      });
    }

    const { data: approved } = await supabase
      .from("driver_applications")
      .select("full_name, personal_photo_url, driver_number")
      .eq("status", "approved")
      .not("personal_photo_url", "is", null)
      .order("driver_number", { ascending: true });

    for (const row of approved || []) {
      const r = row as {
        full_name?: string | null;
        personal_photo_url?: string | null;
        driver_number?: number | null;
      };
      add({
        name: (r.full_name ?? "").trim() || "Fahrer",
        photoUrl: (r.personal_photo_url ?? "").trim(),
        source: "approved",
        driverNumber: r.driver_number ?? null,
      });
    }

    return NextResponse.json({ photos });
  } catch (e) {
    console.error("[website/content/transport-tiles/driver-photos GET]", e);
    return NextResponse.json({ photos: [] }, { status: 200 });
  }
}
