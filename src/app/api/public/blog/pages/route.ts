import { NextResponse } from "next/server";
import { listPublishedPagesNav } from "@/lib/blog";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale")?.trim() || "de";
  const pages = await listPublishedPagesNav(locale);
  return NextResponse.json({ pages });
}
