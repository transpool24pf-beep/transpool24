import { describe, expect, it } from "vitest";
import { adsAllowedForPath } from "./adsense-config";

describe("adsAllowedForPath", () => {
  it("allows homepage and marketing pages", () => {
    expect(adsAllowedForPath("/de")).toBe(true);
    expect(adsAllowedForPath("/ar/blog")).toBe(true);
    expect(adsAllowedForPath("/en/why")).toBe(true);
    expect(adsAllowedForPath("/de/support")).toBe(true);
  });

  it("blocks order, driver, and legal flows", () => {
    expect(adsAllowedForPath("/de/order")).toBe(false);
    expect(adsAllowedForPath("/de/driver")).toBe(false);
    expect(adsAllowedForPath("/de/privacy")).toBe(false);
    expect(adsAllowedForPath("/de/terms")).toBe(false);
  });
});
