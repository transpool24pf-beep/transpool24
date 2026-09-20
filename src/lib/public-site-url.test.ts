import { describe, expect, it } from "vitest";
import { getPublicSiteUrl } from "./public-site-url";

describe("getPublicSiteUrl", () => {
  it("normalizes to https www", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "http://transpool24.com/";
    try {
      expect(getPublicSiteUrl()).toBe("https://www.transpool24.com");
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = prev;
    }
  });
});
