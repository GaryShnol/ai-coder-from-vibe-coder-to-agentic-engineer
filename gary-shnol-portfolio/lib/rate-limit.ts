import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Upstash Redis-backed rate limiter. Set UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN (from upstash.com) in Vercel env and .env.local.
// Falls back to in-memory when running locally without those vars.

function makeRedisLimiter(limit: number, windowMs: number) {
  const redis = Redis.fromEnv();
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
    prefix: "portfolio_rl",
  });
}

// In-memory fallback (local dev only — not safe across serverless instances).
// Cleanup strategy: Redis TTL handles production (zero extra commands, free).
// For the fallback Map, we purge inline on every write AND run a background
// sweep every hour so a long-running dev server never leaks unboundedly.
type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) {
    if (now > v.resetAt) store.delete(k);
  }
}, 60 * 60 * 1000).unref(); // unref: don't keep the process alive for this

function checkInMemory(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  for (const [k, v] of store) {
    if (now > v.resetAt) store.delete(k);
  }
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) return { allowed: false, remaining: 0 };
  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return checkInMemory(key, limit, windowMs);
  }

  try {
    const limiter = makeRedisLimiter(limit, windowMs);
    const { success, remaining } = await limiter.limit(key);
    return { allowed: success, remaining };
  } catch (err) {
    console.error("Upstash rate-limit error, falling back to in-memory:", err);
    return checkInMemory(key, limit, windowMs);
  }
}
