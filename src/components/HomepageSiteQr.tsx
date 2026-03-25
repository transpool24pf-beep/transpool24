"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

type Props = {
  url: string;
  title: string;
  subtitle: string;
  logoAlt: string;
};

const QR_SIZE = 220;
const LOGO_BOX = 64;

/**
 * Site URL QR for the homepage; centered logo with high error correction (H).
 */
export function HomepageSiteQr({ url, title, subtitle, logoAlt }: Props) {
  return (
    <section className="border-y border-[#0d2137]/10 bg-[#f8fafc] py-14 sm:py-16" aria-labelledby="home-site-qr-heading">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 id="home-site-qr-heading" className="text-2xl font-bold text-[var(--primary)] sm:text-3xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--foreground)]/75 sm:text-base">{subtitle}</p>
        <div className="mt-8 flex justify-center">
          <div
            className="relative inline-block rounded-2xl border border-[#0d2137]/10 bg-white p-4 shadow-md"
            style={{ width: QR_SIZE + 32, minHeight: QR_SIZE + 32 }}
          >
            <QRCodeSVG
              value={url}
              size={QR_SIZE}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#0d2137"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-2 ring-white"
              style={{ width: LOGO_BOX + 12, height: LOGO_BOX + 12 }}
            >
              <div className="relative overflow-hidden rounded-lg" style={{ width: LOGO_BOX, height: LOGO_BOX }}>
                <Image src="/4566.png" alt={logoAlt} fill className="object-cover object-center" sizes="64px" />
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 break-all text-xs text-[var(--foreground)]/50 sm:text-sm" dir="ltr">
          {url}
        </p>
      </div>
    </section>
  );
}
