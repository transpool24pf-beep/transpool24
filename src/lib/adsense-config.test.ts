import { describe, expect, it } from "vitest";
import { adsAllowedForPath, adsUseFixedSidebarRails } from "./adsense-config";

describe("adsAllowedForPath", () => {
  it("allows homepage, marketing pages, booking, and driver apply", () => {
    expect(adsAllowedForPath("/de")).toBe(true);
    expect(adsAllowedForPath("/ar/blog")).toBe(true);
    expect(adsAllowedForPath("/en/why")).toBe(true);
    expect(adsAllowedForPath("/de/support")).toBe(true);
    expect(adsAllowedForPath("/de/order")).toBe(true);
    expect(adsAllowedForPath("/de/driver")).toBe(true);
  });

  it("blocks legal flows and driver sub-routes", () => {
    expect(adsAllowedForPath("/de/privacy")).toBe(false);
    expect(adsAllowedForPath("/de/terms")).toBe(false);
    expect(adsAllowedForPath("/de/driver/share-location")).toBe(false);
  });
});

describe("adsUseFixedSidebarRails", () => {
  it("uses in-page columns on order, driver, why, and blog", () => {
    expect(adsUseFixedSidebarRails("/de/order")).toBe(false);
    expect(adsUseFixedSidebarRails("/de/driver")).toBe(false);
    expect(adsUseFixedSidebarRails("/ar/why")).toBe(false);
    expect(adsUseFixedSidebarRails("/ar/blog")).toBe(false);
    expect(adsUseFixedSidebarRails("/de")).toBe(true);
    expect(adsUseFixedSidebarRails("/de/support")).toBe(true);
  });
});
