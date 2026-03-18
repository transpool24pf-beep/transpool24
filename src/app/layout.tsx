import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "TransPool24 – Logistik in Pforzheim",
  description: "Transportaufträge einfach online buchen. Pforzheim und Region.",
  metadataBase: new URL(SITE),
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/png", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
    ],
    apple: "/favicon-48.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="icon" href={`${SITE}/favicon.ico`} type="image/png" />
        <link rel="icon" href={`${SITE}/favicon-32.png`} type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href={`${SITE}/favicon-48.png`} sizes="48x48" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
