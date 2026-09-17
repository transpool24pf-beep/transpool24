import { describe, expect, it } from "vitest";
import { parseStructuredAddressFromLine } from "./structured-address";

describe("parseStructuredAddressFromLine", () => {
  it("fills Google-style street, PLZ, city", () => {
    const a = parseStructuredAddressFromLine("Kaiser-Friedrich-Straße 139, 75172 Pforzheim, Deutschland");
    expect(a.street).toBe("Kaiser-Friedrich-Straße");
    expect(a.houseNumber).toBe("139");
    expect(a.postalCode).toBe("75172");
    expect(a.city).toBe("Pforzheim");
  });

  it("fills Nominatim-style city before PLZ", () => {
    const a = parseStructuredAddressFromLine(
      "Vierheimerweg 76, Neckarau, Mannheim, Baden-Württemberg, 68307, Deutschland",
    );
    expect(a.street).toBe("Vierheimerweg");
    expect(a.houseNumber).toBe("76");
    expect(a.postalCode).toBe("68307");
    expect(a.city).toBe("Mannheim");
  });

  it("does not treat Deutschland as the city", () => {
    const a = parseStructuredAddressFromLine("Hauptstraße 1, 10115 Berlin, Deutschland");
    expect(a.city).toBe("Berlin");
    expect(a.postalCode).toBe("10115");
  });
});
