import { describe, expect, it } from "vitest";
import { PDF_COMPANY, pdfCompanyBrandingLines, pdfCompanyFooterLine } from "./pdf-company";

describe("pdf-company", () => {
  it("includes tax number in branding lines", () => {
    const lines = pdfCompanyBrandingLines();
    expect(lines.some((l) => l.includes(PDF_COMPANY.taxNumber))).toBe(true);
    expect(lines.some((l) => l.includes(PDF_COMPANY.legalOwner))).toBe(true);
  });

  it("includes tax number in footer", () => {
    expect(pdfCompanyFooterLine()).toContain(PDF_COMPANY.taxNumber);
    expect(pdfCompanyFooterLine()).toContain(PDF_COMPANY.addressLine);
  });
});
