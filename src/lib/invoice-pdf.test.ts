import { describe, expect, it } from "vitest";
import type { Job } from "./supabase";
import {
  customerInvoiceServiceName,
  din5008AddressLines,
  formatDeDateYmd,
  sanitizeTextForStandardPdfFont,
} from "./invoice-pdf";

describe("sanitizeTextForStandardPdfFont", () => {
  it("keeps German umlauts and digits", () => {
    expect(sanitizeTextForStandardPdfFont("Müllerstraße 5, Köln")).toBe("Müllerstraße 5, Köln");
  });
  it("replaces Arabic with placeholders", () => {
    const s = sanitizeTextForStandardPdfFont("Test شريف End");
    expect(s).toMatch(/^Test \*+ End$/);
  });
  it("maps Euro sign", () => {
    expect(sanitizeTextForStandardPdfFont("99 €")).toBe("99 EUR");
  });
});

describe("formatDeDateYmd", () => {
  it("formats YYYY-MM-DD as German invoice date without timezone shift", () => {
    expect(formatDeDateYmd("2026-09-30")).toBe("30.09.2026");
  });
});

describe("din5008AddressLines", () => {
  it("prints a letter window with Herrn, name, street, and PLZ Ort", () => {
    expect(
      din5008AddressLines({
        name: "Aqeed Fallah Hassan",
        street: "Hohenzollernstr 83B",
        plzOrt: "75177 Pforzheim",
      }),
    ).toEqual(["Herrn", "Aqeed Fallah Hassan", "Hohenzollernstr 83B", "75177 Pforzheim"]);
  });
});

describe("customerInvoiceServiceName", () => {
  it("includes route, date, and Auftragsnummer", () => {
    const job = {
      company_name: "Aqeed Fallah Hassan",
      pickup_address: "Hohenzollernstr. 83B, 75177 Pforzheim, Deutschland",
      pickup_city: "Pforzheim",
      delivery_address: "Roseneggweg 5, 78244 Gottmadingen, Deutschland",
      delivery_city: "Gottmadingen",
      preferred_pickup_at: "2026-09-30T12:00:00.000Z",
      created_at: "2026-09-20T08:00:00.000Z",
      order_number: 1,
      cargo_details: {
        printedAuftragNumber: "TP-2026-0001",
        senderAddress: {
          company: "Aqeed Fallah Hassan",
          phone: "",
          street: "Hohenzollernstr.",
          houseNumber: "83B",
          postalCode: "75177",
          city: "Pforzheim",
          country: "Deutschland",
          notes: "",
        },
        recipientAddress: {
          company: "Aqeed Fallah Hassan",
          phone: "",
          street: "Roseneggweg",
          houseNumber: "5",
          postalCode: "78244",
          city: "Gottmadingen",
          country: "Deutschland",
          notes: "",
        },
      },
    } as unknown as Job;
    expect(customerInvoiceServiceName(job)).toBe(
      "Umzugsservice von Pforzheim (Hohenzollernstr. 83B) nach Gottmadingen am 30.09.2026 (gemäß Auftragsbestätigung Nr. TP-2026-0001)",
    );
  });
});
