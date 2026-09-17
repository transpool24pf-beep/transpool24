import { describe, expect, it } from "vitest";
import { formatAuftragNumber } from "./order-ref";

describe("formatAuftragNumber", () => {
  it("uses TP-year-serial", () => {
    expect(
      formatAuftragNumber({ order_number: 161544, created_at: "2026-09-17T10:00:00.000Z" }),
    ).toBe("TP-2026-161544");
  });
});
