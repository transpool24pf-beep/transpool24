import { describe, expect, it } from "vitest";
import { jobIdFromCheckoutSession } from "./stripe-webhook-helpers";

describe("jobIdFromCheckoutSession", () => {
  it("prefers metadata.job_id", () => {
    expect(
      jobIdFromCheckoutSession({
        metadata: { job_id: "  uuid-1  ", other: "x" },
        client_reference_id: "uuid-2",
      }),
    ).toBe("uuid-1");
  });

  it("falls back to client_reference_id", () => {
    expect(
      jobIdFromCheckoutSession({
        metadata: {},
        client_reference_id: "uuid-2",
      }),
    ).toBe("uuid-2");
  });

  it("returns null when missing", () => {
    expect(jobIdFromCheckoutSession({ metadata: null, client_reference_id: null })).toBeNull();
    expect(jobIdFromCheckoutSession({ metadata: {}, client_reference_id: "" })).toBeNull();
  });
});
