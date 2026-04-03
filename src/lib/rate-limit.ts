import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/request-ip";

export type RatePreset =
  | "checkout"
  | "confirm"
  | "support"
  | "driverApply"
  | "pricePreview"
  | "upload"
  | "publicDriver"
  | "orderConfirmLink";

const PRESETS: Record<RatePreset, { windowMs: number; max: number }> = {
  checkout: { windowMs: 60 * 60 * 1000, max: 30 },
  confirm: { windowMs: 60 * 60 * 1000, max: 25 },
  support: { windowMs: 60 * 60 * 1000, max: 15 },
  driverApply: { windowMs: 60 * 60 * 1000, max: 8 },
  pricePreview: { windowMs: 60 * 60 * 1000, max: 120 },
  upload: { windowMs: 60 * 60 * 1000, max: 40 },
  publicDriver: { windowMs: 60 * 60 * 1000, max: 200 },
  orderConfirmLink: { windowMs: 60 * 60 * 1000, max: 40 },
};

const MAX_KEYS = 20_000;

type Bucket = Map<string, number[]>;

function getBucketStore(): Bucket {
  const g = globalThis as typeof globalThis & { __tp24RateBuckets?: Bucket };
  if (!g.__tp24RateBuckets) g.__tp24RateBuckets = new Map();
  return g.__tp24RateBuckets;
}

/** Exported for unit tests. */
export function pruneTimestamps(ts: number[], windowMs: number, now: number): void {
  const cutoff = now - windowMs;
  let i = 0;
  while (i < ts.length && ts[i]! < cutoff) i++;
  if (i > 0) ts.splice(0, i);
}

/**
 * Per-instance sliding window (sufficient to cut abuse on a single region; for multi-region use Redis/Upstash).
 * Set RATE_LIMIT_DISABLED=1 to turn off (e.g. local stress tests).
 */
export function rateLimitHit(key: string, preset: RatePreset, now = Date.now()): boolean {
  const { windowMs, max } = PRESETS[preset];
  const buckets = getBucketStore();
  let ts = buckets.get(key);
  if (!ts) {
    if (buckets.size >= MAX_KEYS) {
      const first = buckets.keys().next().value;
      if (first) buckets.delete(first);
    }
    ts = [];
    buckets.set(key, ts);
  }
  pruneTimestamps(ts, windowMs, now);
  if (ts.length >= max) return false;
  ts.push(now);
  return true;
}

export function rateLimitResponse(req: Request, preset: RatePreset): NextResponse | null {
  if (process.env.RATE_LIMIT_DISABLED === "1" || process.env.RATE_LIMIT_DISABLED === "true") {
    return null;
  }
  const ip = getClientIp(req);
  const key = `${preset}:${ip}`;
  const ok = rateLimitHit(key, preset);
  if (!ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  return null;
}

export function rateLimitModeForAdmin(): "off" | "memory" {
  if (process.env.RATE_LIMIT_DISABLED === "1" || process.env.RATE_LIMIT_DISABLED === "true") return "off";
  return "memory";
}
