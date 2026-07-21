import { NextResponse } from "next/server";

/**
 * In-memory sliding window rate limiter.
 *
 * Tracks request counts per `(key, route)` pair over a rolling window.
 * For production with multiple instances, replace with Redis-based
 * (upstash-ratelimit or similar).
 */
interface WindowEntry {
  timestamps: number[];
}

const stores = new Map<string, WindowEntry>();

// Periodic cleanup every 60 seconds to evict stale entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of stores) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 60_000);
    if (entry.timestamps.length === 0) {
      stores.delete(key);
    }
  }
}, 60_000).unref();

export interface RateLimitConfig {
  /** Unique key combining identifier + route */
  key: string;
  /** Max requests allowed within the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Check rate limit for a given key.
 *
 * @returns Object with `allowed`, `remaining`, and `resetInSeconds`.
 */
export function checkRateLimit({
  key,
  maxRequests,
  windowSeconds = 60,
}: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let entry = stores.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    stores.set(key, entry);
  }

  // Prune timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  const remaining = Math.max(0, maxRequests - entry.timestamps.length);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: remaining - 1, resetInSeconds: 0 };
}

/**
 * Create a rate-limited handler response for 429 status.
 */
export function rateLimitResponse(resetInSeconds: number): NextResponse {
  return NextResponse.json(
    {
      error: "RATE_LIMITED",
      message: `Terlalu banyak permintaan. Silakan coba lagi dalam ${resetInSeconds} detik.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetInSeconds),
        "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + resetInSeconds),
      },
    },
  );
}
