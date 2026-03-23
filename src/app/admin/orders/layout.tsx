/** Avoid stale CDN/cache for the orders dashboard (client still fetches API). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminOrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
