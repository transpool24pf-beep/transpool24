/** Presentation-form shaping so Noto Naskh can draw Arabic in pdf-lib (no OpenType GSUB). */

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasArabicScript(s: string): boolean {
  return ARABIC_RE.test(s ?? "");
}

const TRANSPARENT = new Set("\u064B\u064C\u064D\u064E\u064F\u0650\u0651\u0652\u0670".split(""));

/** Isolated, final, initial, medial (2-form letters repeat initial/medial as isolated/final). */
const FORMS: Record<string, [string, string, string, string]> = {
  "\u0627": ["\uFE8D", "\uFE8E", "\uFE8D", "\uFE8E"],
  "\u0622": ["\uFE81", "\uFE82", "\uFE81", "\uFE82"],
  "\u0623": ["\uFE83", "\uFE84", "\uFE83", "\uFE84"],
  "\u0625": ["\uFE87", "\uFE88", "\uFE87", "\uFE88"],
  "\u0628": ["\uFE8F", "\uFE90", "\uFE91", "\uFE92"],
  "\u062A": ["\uFE95", "\uFE96", "\uFE97", "\uFE98"],
  "\u062B": ["\uFE99", "\uFE9A", "\uFE9B", "\uFE9C"],
  "\u062C": ["\uFE9D", "\uFE9E", "\uFE9F", "\uFEA0"],
  "\u062D": ["\uFEA1", "\uFEA2", "\uFEA3", "\uFEA4"],
  "\u062E": ["\uFEA5", "\uFEA6", "\uFEA7", "\uFEA8"],
  "\u062F": ["\uFEA9", "\uFEAA", "\uFEA9", "\uFEAA"],
  "\u0630": ["\uFEAB", "\uFEAC", "\uFEAB", "\uFEAC"],
  "\u0631": ["\uFEAD", "\uFEAE", "\uFEAD", "\uFEAE"],
  "\u0632": ["\uFEAF", "\uFEB0", "\uFEAF", "\uFEB0"],
  "\u0633": ["\uFEB1", "\uFEB2", "\uFEB3", "\uFEB4"],
  "\u0634": ["\uFEB5", "\uFEB6", "\uFEB7", "\uFEB8"],
  "\u0635": ["\uFEB9", "\uFEBA", "\uFEBB", "\uFEBC"],
  "\u0636": ["\uFEBD", "\uFEBE", "\uFEBF", "\uFEC0"],
  "\u0637": ["\uFEC1", "\uFEC2", "\uFEC3", "\uFEC4"],
  "\u0638": ["\uFEC5", "\uFEC6", "\uFEC7", "\uFEC8"],
  "\u0639": ["\uFEC9", "\uFECA", "\uFECB", "\uFECC"],
  "\u063A": ["\uFECD", "\uFECE", "\uFECF", "\uFED0"],
  "\u0641": ["\uFED1", "\uFED2", "\uFED3", "\uFED4"],
  "\u0642": ["\uFED5", "\uFED6", "\uFED7", "\uFED8"],
  "\u0643": ["\uFED9", "\uFEDA", "\uFEDB", "\uFEDC"],
  "\u0644": ["\uFEDD", "\uFEDE", "\uFEDF", "\uFEE0"],
  "\u0645": ["\uFEE1", "\uFEE2", "\uFEE3", "\uFEE4"],
  "\u0646": ["\uFEE5", "\uFEE6", "\uFEE7", "\uFEE8"],
  "\u0647": ["\uFEE9", "\uFEEA", "\uFEEB", "\uFEEC"],
  "\u0648": ["\uFEED", "\uFEEE", "\uFEED", "\uFEEE"],
  "\u0649": ["\uFEEF", "\uFEF0", "\uFEEF", "\uFEF0"],
  "\u064A": ["\uFEF1", "\uFEF2", "\uFEF3", "\uFEF4"],
  "\u0629": ["\uFE93", "\uFE94", "\uFE93", "\uFE94"],
  "\u0624": ["\uFE85", "\uFE86", "\uFE85", "\uFE86"],
  "\u0626": ["\uFE89", "\uFE8A", "\uFE8B", "\uFE8C"],
};

const DUAL = new Set(Object.keys(FORMS).filter((c) => FORMS[c]![2] !== FORMS[c]![0]));

function canConnectToNext(ch: string): boolean {
  return DUAL.has(ch);
}

function canConnectFromPrev(ch: string): boolean {
  return ch in FORMS;
}

function nextLetter(chars: string[], i: number): string | null {
  for (let j = i + 1; j < chars.length; j++) {
    if (TRANSPARENT.has(chars[j]!)) continue;
    return chars[j]!;
  }
  return null;
}

function prevLetter(chars: string[], i: number): string | null {
  for (let j = i - 1; j >= 0; j--) {
    if (TRANSPARENT.has(chars[j]!)) continue;
    return chars[j]!;
  }
  return null;
}

export function shapeArabic(input: string): string {
  const chars = [...input.normalize("NFC")];
  const out: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (TRANSPARENT.has(ch) || !(ch in FORMS)) {
      out.push(ch);
      continue;
    }
    const prev = prevLetter(chars, i);
    const next = nextLetter(chars, i);
    const joinsPrev = !!(prev && canConnectToNext(prev) && canConnectFromPrev(ch));
    const joinsNext = !!(next && canConnectToNext(ch) && canConnectFromPrev(next));
    const form = FORMS[ch]!;
    if (joinsPrev && joinsNext) out.push(form[3]);
    else if (joinsPrev) out.push(form[1]);
    else if (joinsNext) out.push(form[2]);
    else out.push(form[0]);
  }
  return ligatureLamAlef(out.join(""));
}

function ligatureLamAlef(s: string): string {
  return s
    .replace(/\uFEDF\uFE8E/g, "\uFEFC")
    .replace(/\uFEDF\uFE8D/g, "\uFEFB")
    .replace(/\uFEE0\uFE8E/g, "\uFEFC")
    .replace(/\uFEE0\uFE8D/g, "\uFEFB")
    .replace(/\uFEDF\uFE82/g, "\uFEF6")
    .replace(/\uFEDF\uFE81/g, "\uFEF5")
    .replace(/\uFEDF\uFE84/g, "\uFEF8")
    .replace(/\uFEDF\uFE83/g, "\uFEF7");
}

/** Visual order for LTR PDF drawing: reverse Arabic runs, keep Latin/digits. */
export function arabicForPdfDraw(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  if (!hasArabicScript(s)) return s;
  const shaped = shapeArabic(s);
  const parts = shaped.split(/(\s+)/);
  return parts
    .map((p) => {
      if (!p || /^\s+$/.test(p)) return p;
      if (!hasArabicScript(p)) return p;
      return [...p].reverse().join("");
    })
    .join("");
}
