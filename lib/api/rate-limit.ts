/**
 * Lightweight rate limiter for API routes.
 * Uses Redis when REDIS_URL is set (optional future); falls back to
 * an in-memory sliding window per process — suitable for single-instance
 * and demo deploys. For multi-instance production, set REDIS_URL and
 * wire a Redis backend (see ARCHITECTURE.md).
 */

type Bucket = { timestamps: number[] };

const globalStore = globalThis as unknown as {
  __manethoRateLimit?: Map<string, Bucket>;
};

function store(): Map<string, Bucket> {
  if (!globalStore.__manethoRateLimit) {
    globalStore.__manethoRateLimit = new Map();
  }
  return globalStore.__manethoRateLimit;
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; remaining: number; retryAfterSec: number };

/**
 * Sliding-window rate limit.
 * @param key identity key (ip, user id, …)
 * @param limit max requests in the window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const buckets = store();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return { ok: false, remaining: 0, retryAfterSec };
  }
  bucket.timestamps.push(now);
  return { ok: true, remaining: Math.max(0, limit - bucket.timestamps.length) };
}

/** Client IP from common proxy headers (Vercel / Cloudflare / reverse proxy). */
export function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
