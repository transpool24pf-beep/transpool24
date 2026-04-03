import { describe, expect, it } from "vitest";
import { pruneTimestamps, rateLimitHit } from "./rate-limit";

describe("pruneTimestamps", () => {
  it("drops entries older than window", () => {
    const now = 1_000_000;
    const ts = [now - 10_000, now - 5_000, now - 1_000, now];
    pruneTimestamps(ts, 3_000, now);
    expect(ts).toEqual([now - 1_000, now]);
  });
});

describe("rateLimitHit", () => {
  it("allows under max and blocks at limit", () => {
    const key = `test:${Math.random()}`;
    const preset = "driverApply";
    const base = Date.now();
    for (let i = 0; i < 8; i++) {
      expect(rateLimitHit(key, preset, base + i)).toBe(true);
    }
    expect(rateLimitHit(key, preset, base + 8)).toBe(false);
  });
});
