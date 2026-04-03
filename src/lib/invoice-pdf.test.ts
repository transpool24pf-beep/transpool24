import { describe, expect, it } from "vitest";
import { sanitizeTextForStandardPdfFont } from "./invoice-pdf";

describe("sanitizeTextForStandardPdfFont", () => {
  it("keeps German umlauts and digits", () => {
    expect(sanitizeTextForStandardPdfFont("Müllerstraße 5, Köln")).toBe("Müllerstraße 5, Köln");
  });
  it("replaces Arabic with placeholders", () => {
    const s = sanitizeTextForStandardPdfFont("Test شريف End");
    expect(s).toMatch(/^Test \?+ End$/);
  });
  it("maps Euro sign", () => {
    expect(sanitizeTextForStandardPdfFont("99 €")).toBe("99 EUR");
  });
});
