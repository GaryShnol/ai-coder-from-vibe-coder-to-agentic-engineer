import { Redis } from "@upstash/redis";
import type { CtaEventType, CtaSurface } from "@/lib/cta-types";

// Upstash Redis-backed CTA event counter. Set UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN (from upstash.com) in Vercel env and .env.local.
// Falls back to in-memory when running locally without those vars.
//
// Sibling prefix to lib/rate-limit.ts's "portfolio_rl" — kept distinct so the
// two namespaces never collide.
const PREFIX = "portfolio_events";
const COUNTER_TTL_SECONDS = 90 * 24 * 60 * 60; // ~90 days
const LOG_MAX_LENGTH = 200;
const QUESTION_MAX_LENGTH = 200;

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = null;
    return redisClient;
  }
  redisClient = Redis.fromEnv();
  return redisClient;
}

// In-memory fallback (local dev only — not safe across serverless instances).
// Same acceptance as rate-limit.ts: counts won't persist across instances
// locally, that's fine. Qualitative log is skipped in fallback mode.
const counters = new Map<string, number>();

function incrementInMemory(key: string): void {
  counters.set(key, (counters.get(key) ?? 0) + 1);
}

function counterKey(surface: CtaSurface, event: CtaEventType, date: string): string {
  return `${PREFIX}:${surface}:${event}:${date}`;
}

function logKey(surface: CtaSurface): string {
  return `${PREFIX}:${surface}:log`;
}

function truncateQuestion(question: string | undefined): string | undefined {
  if (typeof question !== "string") return question;
  return question.length > QUESTION_MAX_LENGTH ? question.slice(0, QUESTION_MAX_LENGTH) : question;
}

export async function logCtaEvent(
  surface: CtaSurface,
  event: CtaEventType,
  context?: { role?: string; question?: string }
): Promise<void> {
  const date = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD; never trust client date
  const key = counterKey(surface, event, date);
  const question = truncateQuestion(context?.question);

  const redis = getRedis();

  if (!redis) {
    incrementInMemory(key);
    return;
  }

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      // Only set TTL when the counter was just created, to avoid resetting
      // expiry on every increment.
      await redis.expire(key, COUNTER_TTL_SECONDS);
    }

    if (event === "click") {
      const entry = JSON.stringify({
        surface,
        role: context?.role,
        question,
        ts: Date.now(),
      });
      const listKey = logKey(surface);
      await redis.lpush(listKey, entry);
      await redis.ltrim(listKey, 0, LOG_MAX_LENGTH - 1);
    }
  } catch (err) {
    console.error("CTA event log error, falling back to in-memory:", err);
    incrementInMemory(key);
  }
}
