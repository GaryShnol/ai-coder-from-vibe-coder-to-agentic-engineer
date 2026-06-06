// WARNING: This store is process-local (in-memory Map). It does NOT enforce
// limits across multiple serverless instances or Vercel cold starts. Each new
// function instance starts with an empty store. For production multi-instance
// enforcement, replace this with a shared store (e.g. Upstash Redis).

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();

  // Purge all expired entries on every write to prevent unbounded growth.
  for (const [k, v] of store) {
    if (now > v.resetAt) store.delete(k);
  }

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}
