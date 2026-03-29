import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Fahrer bewerten",
  description: "TransPool24 — Bewertung nach abgeschlossener Fahrt (privater Link).",
};

export default function RateDriverLayout({ children }: { children: ReactNode }) {
  return children;
}
