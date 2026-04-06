import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found/NotFoundView";

export const metadata: Metadata = {
  title: { absolute: "TransPool24 | Admin — 404" },
  robots: { index: false, follow: false },
};

export default function AdminNotFound() {
  return <NotFoundView />;
}
