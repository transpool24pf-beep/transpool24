import { permanentRedirect } from "next/navigation";

export default async function RateDriverRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params?.token ? `?token=${encodeURIComponent(params.token)}` : "";
  permanentRedirect(`/de/rate-driver${token}`);
}
