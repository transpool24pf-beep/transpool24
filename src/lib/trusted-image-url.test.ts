import { describe, expect, it } from "vitest";
import { isTrustedPodImageUrl } from "./trusted-image-url";

describe("isTrustedPodImageUrl", () => {
  it("allows supabase storage https", () => {
    expect(
      isTrustedPodImageUrl("https://abcdefgh.supabase.co/storage/v1/object/public/x/y.jpg"),
    ).toBe(true);
  });
  it("rejects random hosts", () => {
    expect(isTrustedPodImageUrl("https://evil.example.com/a.jpg")).toBe(false);
  });
  it("rejects non-https", () => {
    expect(isTrustedPodImageUrl("http://abcdefgh.supabase.co/a.jpg")).toBe(false);
  });
});
