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

export const metadata: Metadata = {
  title: "TransPool24 – Logistik in Pforzheim",
  description: "Transportaufträge einfach online buchen. Pforzheim und Region.",
  icons: {
    icon: [{ url: "/icon.png?v=2", type: "image/png", sizes: "32x32" }, { url: "/icon.png?v=2", type: "image/png", sizes: "192x192" }],
    apple: "/icon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
