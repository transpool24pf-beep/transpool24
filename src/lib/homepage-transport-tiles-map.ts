export type HomepageTransportTileRow = {
  id: number;
  title: string;
  image_url: string;
  order: number;
};

export function mapHomepageTransportTileRow(r: HomepageTransportTileRow) {
  return {
    id: r.id,
    title: r.title,
    imageUrl: r.image_url,
    order: r.order,
  };
}
