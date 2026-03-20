export type HomepageDriverRow = {
  id: number;
  name: string;
  photo: string;
  rating: number;
  comment: string;
  customer_name: string;
  order: number;
};

/** Map Supabase row to client-friendly shape for homepage drivers CMS & public API */
export function mapHomepageDriverRow(r: HomepageDriverRow) {
  return {
    id: r.id,
    name: r.name,
    photo: r.photo,
    rating: r.rating,
    comment: r.comment,
    customerName: r.customer_name,
    order: r.order,
  };
}
