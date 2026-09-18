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

  it("fills street, house, city when Google omits the PLZ", () => {
    const a = parseStructuredAddressFromLine("Rosenegaweg 5, Gottmadingen, Deutschland");
    expect(a.street).toBe("Rosenegaweg");
    expect(a.houseNumber).toBe("5");
    expect(a.city).toBe("Gottmadingen");
  });

  it("does not use Landkreis as the city", () => {
    const a = parseStructuredAddressFromLine(
      "Rosenegaweg 5, Gottmadingen, Landkreis Konstanz, Baden-Württemberg, 78244, Deutschland",
    );
    expect(a.street).toBe("Rosenegaweg");
    expect(a.houseNumber).toBe("5");
    expect(a.postalCode).toBe("78244");
    expect(a.city).toBe("Gottmadingen");
  });
});
