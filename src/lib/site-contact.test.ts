import { describe, expect, it } from "vitest";
import { DEFAULT_PUBLIC_CONTACT_EMAIL, getPublicContactEmail, getPublicContactMailto, getPublicContactPhone, getPublicContactTelHref } from "./site-contact";

describe("site-contact", () => {
  it("defaults to transpool24pf@gmail.com and the public mobile number", () => {
    delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
    delete process.env.PUBLIC_CONTACT_EMAIL;
    delete process.env.NEXT_PUBLIC_CONTACT_PHONE;
    expect(getPublicContactEmail()).toBe(DEFAULT_PUBLIC_CONTACT_EMAIL);
    expect(getPublicContactMailto()).toBe(`mailto:${DEFAULT_PUBLIC_CONTACT_EMAIL}`);
    expect(getPublicContactPhone()).toBe("+49 176 22624264");
    expect(getPublicContactTelHref()).toBe("tel:+4917622624264");
  });

  it("reads NEXT_PUBLIC_CONTACT_EMAIL override", () => {
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = "custom@transpool24.com";
    expect(getPublicContactEmail()).toBe("custom@transpool24.com");
    delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  });
});
