"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeCanvas } from "qrcode.react";

type Props = {
  url: string;
  /** Softer chrome when placed inside the Why page card */
  embedded?: boolean;
};

const QR_SIZE = 220;
const LOGO_PX = 56;

/**
 * QR to open the site on mobile; logo embedded via qrcode.react excavate + copy / download / share.
 */
export function SiteQrSection({ url, embedded }: Props) {
  const t = useTranslations("home.siteQr");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setDownloadError(true);
      setTimeout(() => setDownloadError(false), 3000);
    }
  }, [url]);

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "transpool24-qr.png";
      a.click();
      setDownloadError(false);
    } catch {
      setDownloadError(true);
      setTimeout(() => setDownloadError(false), 3000);
    }
  }, []);

  const share = useCallback(async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title: t("shareTitle"),
        text: t("shareText"),
        url,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      await copyLink();
    }
  }, [copyLink, t, url]);

  const shell = embedded
    ? "rounded-2xl border border-[#0d2137]/10 bg-[#fafbfc] px-4 py-8 sm:px-8 sm:py-10"
    : "border-y border-[#0d2137]/10 bg-[#f8fafc] py-14 sm:py-16";

  return (
    <section className={shell} aria-labelledby="site-qr-heading">
      <div className={`mx-auto text-center ${embedded ? "max-w-lg" : "max-w-7xl px-4 sm:px-6 lg:px-8"}`}>
        <h2 id="site-qr-heading" className="text-xl font-bold text-[var(--primary)] sm:text-2xl md:text-3xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--foreground)]/75 sm:text-base">{t("subtitle")}</p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div
            className="inline-block rounded-2xl border border-[#0d2137]/10 bg-white p-4 shadow-md"
            style={{ width: QR_SIZE + 32 }}
          >
            <QRCodeCanvas
              ref={canvasRef}
              value={url}
              size={QR_SIZE}
              level="H"
              marginSize={1}
              bgColor="#ffffff"
              fgColor="#0d2137"
              imageSettings={{
                src: "/4566.png",
                height: LOGO_PX,
                width: LOGO_PX,
                excavate: true,
                crossOrigin: "anonymous",
              }}
            />
          </div>

          <p className="break-all text-xs text-[var(--foreground)]/50 sm:text-sm" dir="ltr">
            {url}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="rounded-xl border border-[#0d2137]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--primary)] shadow-sm transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5"
            >
              {copied ? t("copied") : t("copyLink")}
            </button>
            <button
              type="button"
              onClick={downloadPng}
              className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
            >
              {t("downloadPng")}
            </button>
            <button
              type="button"
              onClick={() => void share()}
              className="rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
            >
              {t("share")}
            </button>
          </div>
          {downloadError && (
            <p className="text-xs text-amber-700" role="status">
              {t("actionError")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
