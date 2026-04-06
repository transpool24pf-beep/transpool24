import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found/NotFoundView";

export const metadata: Metadata = {
  title: { absolute: "TransPool24 | 404" },
  robots: { index: false, follow: false },
};

export default function LocaleNotFound() {
  return <NotFoundView />;
}
