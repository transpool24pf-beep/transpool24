import { describe, expect, it } from "vitest";
import { eurosToCents, monthRangeUtc } from "./bookkeeping";
import { parseOcrPayload } from "./bookkeeping-ocr";

describe("eurosToCents", () => {
  it("parses German and numeric amounts", () => {
    expect(eurosToCents("12,34")).toBe(1234);
    expect(eurosToCents("1.234,50")).toBe(123450);
    expect(eurosToCents(19.99)).toBe(1999);
  });
});

describe("parseOcrPayload", () => {
  it("maps tank receipt fields", () => {
    const out = parseOcrPayload({
      vendor_name: "Aral Tankstelle",
      document_date: "16.10.2026",
      gross_eur: 64.2,
      vat_eur: 10.25,
      vat_rate: 19,
      category: "kraftstoff",
    });
    expect(out.vendor_name).toBe("Aral Tankstelle");
    expect(out.document_date).toBe("2026-10-16");
    expect(out.gross_cents).toBe(6420);
    expect(out.category).toBe("kraftstoff");
  });
});

describe("monthRangeUtc", () => {
  it("covers November 2026", () => {
    expect(monthRangeUtc(2026, 11)).toEqual({ from: "2026-11-01", to: "2026-12-01" });
  });
});
