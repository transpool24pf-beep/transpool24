import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { GlobalPageLoadingOverlay } from "@/components/GlobalPageLoadingOverlay";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.transpool24.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "TransPool24 | Logistik & Transportunternehmen Pforzheim",
    template: "TransPool24 | %s",
  },
  description:
    "Digital logistics & road transport in Pforzheim, Germany — book online, real-time tracking, secure payments.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  verification: {
    google: "mHa9lgBmjQYj6ODwN5JtGqKC83sFZ6Gfr-aTgKA9O6k",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href={`${SITE}/favicon.ico`} sizes="any" />
        <link rel="icon" href={`${SITE}/favicon.png`} type="image/png" sizes="512x512" />
        <link rel="icon" href={`${SITE}/favicon-32.png`} type="image/png" sizes="32x32" />
        <link rel="icon" href={`${SITE}/favicon-48.png`} type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href={`${SITE}/apple-touch-icon.png`} sizes="180x180" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <GlobalPageLoadingOverlay />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
