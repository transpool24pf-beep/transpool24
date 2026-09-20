import { describe, expect, it } from "vitest";
import { resolveCanonicalRedirect } from "./canonical-request";

describe("resolveCanonicalRedirect", () => {
  it("sends apex home to https www /de in one hop", () => {
    expect(resolveCanonicalRedirect("transpool24.com", "/")).toBe(
      "https://www.transpool24.com/de",
    );
  });

  it("prefixes public paths with /de and www", () => {
    expect(resolveCanonicalRedirect("www.transpool24.com", "/driver")).toBe(
      "https://www.transpool24.com/de/driver",
    );
    expect(resolveCanonicalRedirect("transpool24.com", "/blog/welcome-transpool24-magazine")).toBe(
      "https://www.transpool24.com/de/blog/welcome-transpool24-magazine",
    );
  });

  it("only changes host when locale is already present", () => {
    expect(resolveCanonicalRedirect("transpool24.com", "/de/order")).toBe(
      "https://www.transpool24.com/de/order",
    );
    expect(resolveCanonicalRedirect("www.transpool24.com", "/de/order")).toBeNull();
  });

  it("leaves admin on www alone", () => {
    expect(resolveCanonicalRedirect("www.transpool24.com", "/admin/orders")).toBeNull();
  });
});
