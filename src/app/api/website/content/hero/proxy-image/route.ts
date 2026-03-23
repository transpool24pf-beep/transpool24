import { NextResponse } from "next/server";
import { requireWebsiteAdmin } from "@/lib/website-admin-api";

const MAX_BYTES = 15 * 1024 * 1024;
const TIMEOUT_MS = 20_000;

function assertFetchableUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Error("Only http(s) URLs");
  }
  if (process.env.NODE_ENV === "production" && u.protocol !== "https:") {
    throw new Error("HTTPS required");
  }
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    throw new Error("URL host not allowed");
  }
  return u;
}

export async function POST(req: Request) {
  const err = await requireWebsiteAdmin();
  if (err) return err;

  try {
    const body = await req.json();
    const rawUrl = typeof body.url === "string" ? body.url : "";
    const u = assertFetchableUrl(rawUrl);

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
    const res = await fetch(u.toString(), {
      signal: ac.signal,
      redirect: "follow",
      headers: { Accept: "image/*,*/*;q=0.8" },
    });
    clearTimeout(t);

    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed (${res.status})` }, { status: 400 });
    }

    const ct = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!ct.startsWith("image/")) {
      return NextResponse.json({ error: "Response is not an image" }, { status: 400 });
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return NextResponse.json({ error: "Image too large (max 15 MB)" }, { status: 400 });
    }

    const base64 = buf.toString("base64");
    return NextResponse.json({ mime: ct, base64 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Proxy failed";
    console.error("[website/hero/proxy-image]", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
