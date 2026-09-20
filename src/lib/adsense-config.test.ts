import { describe, expect, it } from "vitest";
import { adsAllowedForPath, adsUseFixedSidebarRails } from "./adsense-config";

describe("adsAllowedForPath", () => {
  it("allows homepage, marketing pages, and the order form", () => {
    expect(adsAllowedForPath("/de")).toBe(true);
    expect(adsAllowedForPath("/ar/blog")).toBe(true);
    expect(adsAllowedForPath("/en/why")).toBe(true);
    expect(adsAllowedForPath("/de/support")).toBe(true);
    expect(adsAllowedForPath("/de/order")).toBe(true);
  });

  it("blocks driver and legal flows", () => {
    expect(adsAllowedForPath("/de/driver")).toBe(false);
    expect(adsAllowedForPath("/de/privacy")).toBe(false);
    expect(adsAllowedForPath("/de/terms")).toBe(false);
  });
});

describe("adsUseFixedSidebarRails", () => {
  it("uses in-page columns on the order form instead of viewport rails", () => {
    expect(adsUseFixedSidebarRails("/de/order")).toBe(false);
    expect(adsUseFixedSidebarRails("/de")).toBe(true);
    expect(adsUseFixedSidebarRails("/ar/blog")).toBe(true);
  });
});
