export type HomepageTransportTileRow = {
  id: number;
  title: string;
  image_url: string;
  order: number;
  driver_photo_url?: string | null;
};

export function mapHomepageTransportTileRow(r: HomepageTransportTileRow) {
  const driverPhoto = (r.driver_photo_url ?? "").trim();
  return {
    id: r.id,
    title: r.title,
    imageUrl: r.image_url,
    driverPhotoUrl: driverPhoto,
    order: r.order,
  };
}

export function tileWritePayload(body: {
  title?: unknown;
  imageUrl?: unknown;
  driverPhotoUrl?: unknown;
  order?: unknown;
}) {
  const driverPhotoUrl =
    typeof body.driverPhotoUrl === "string" ? body.driverPhotoUrl.trim() : "";
  return {
    title: body.title,
    image_url: body.imageUrl,
    order: body.order,
    driver_photo_url: driverPhotoUrl || null,
  };
}
