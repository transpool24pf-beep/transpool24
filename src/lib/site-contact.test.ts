import { describe, expect, it } from "vitest";
import { DEFAULT_PUBLIC_CONTACT_EMAIL, getPublicContactEmail, getPublicContactMailto } from "./site-contact";

describe("site-contact", () => {
  it("defaults to hello@transpool24.com", () => {
    delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
    delete process.env.PUBLIC_CONTACT_EMAIL;
    expect(getPublicContactEmail()).toBe(DEFAULT_PUBLIC_CONTACT_EMAIL);
    expect(getPublicContactMailto()).toBe(`mailto:${DEFAULT_PUBLIC_CONTACT_EMAIL}`);
  });

  it("reads NEXT_PUBLIC_CONTACT_EMAIL override", () => {
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = "custom@transpool24.com";
    expect(getPublicContactEmail()).toBe("custom@transpool24.com");
    delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  });
});
