import { PDFDocument } from "pdf-lib";
import type { BookkeepingReceipt } from "@/lib/bookkeeping";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 18;

export async function buildBookkeepingMonthPdf(input: {
  year: number;
  month: number;
  receipts: BookkeepingReceipt[];
  images: { id: string; bytes: Uint8Array; mime: string }[];
  pdfs: { id: string; bytes: Uint8Array }[];
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const imagesById = new Map(input.images.map((im) => [im.id, im]));
  const pdfsById = new Map(input.pdfs.map((p) => [p.id, p]));
  let added = 0;

  for (const r of input.receipts) {
    const img = imagesById.get(r.id);
    const attachedPdf = pdfsById.get(r.id);
    if (img) {
      try {
        const embedded =
          img.mime === "image/png" ? await doc.embedPng(img.bytes) : await doc.embedJpg(img.bytes);
        const maxW = PAGE_W - MARGIN * 2;
        const maxH = PAGE_H - MARGIN * 2;
        const scale = Math.min(maxW / embedded.width, maxH / embedded.height);
        const w = embedded.width * scale;
        const h = embedded.height * scale;
        const page = doc.addPage([PAGE_W, PAGE_H]);
        page.drawImage(embedded, {
          x: (PAGE_W - w) / 2,
          y: (PAGE_H - h) / 2,
          width: w,
          height: h,
        });
        added += 1;
      } catch {
        /* skip unreadable photo */
      }
    } else if (attachedPdf) {
      try {
        const src = await PDFDocument.load(attachedPdf.bytes);
        const copied = await doc.copyPages(src, src.getPageIndices());
        copied.forEach((copiedPage) => doc.addPage(copiedPage));
        added += copied.length;
      } catch {
        /* skip unreadable pdf */
      }
    }
  }

  if (added === 0) {
    doc.addPage([PAGE_W, PAGE_H]);
  }

  return doc.save();
}
