import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const RELATIVE_PATHS = [
  join("public", "fonts", "NotoNaskhArabic-Regular.ttf"),
  join("src", "lib", "fonts", "NotoNaskhArabic-Regular.ttf"),
];

function fontPath(): string | null {
  for (const rel of RELATIVE_PATHS) {
    const p = join(process.cwd(), rel);
    if (existsSync(p)) return p;
  }
  return null;
}

export async function embedArabicPdfFont(doc: PDFDocument): Promise<PDFFont | null> {
  try {
    const p = fontPath();
    if (!p) return null;
    doc.registerFontkit(fontkit);
    const bytes = readFileSync(p);
    return await doc.embedFont(bytes, { subset: true });
  } catch {
    return null;
  }
}
