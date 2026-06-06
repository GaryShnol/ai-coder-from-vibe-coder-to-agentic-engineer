# Code Review — gary-shnol-portfolio

**Date:** 2026-06-06  
**Reviewer:** Claude Code (automated multi-angle review)  
**Scope:** Full repository — all committed code plus uncommitted working-tree changes  
**Branch:** master  

---

## Summary

10 findings across correctness, security, performance, and maintainability. 3 are high severity and should be fixed before a production deployment. The most critical issue is that rate limiting silently does nothing in the deployed (serverless) environment.

| # | Severity | Category | File | Short title |
|---|----------|----------|------|-------------|
| 1 | HIGH | Security | `lib/rate-limit.ts` | In-memory rate limit bypassed in serverless |
| 2 | HIGH | Reliability | `app/api/chat/route.ts` + `marketing/route.ts` | No fetch timeout — function hangs indefinitely |
| 3 | HIGH | Security/UX | `app/api/chat/route.ts` | Rate limit consumed before input validation |
| 4 | MEDIUM | Bug | `components/Hero.tsx` | Particle count wrong after viewport resize |
| 5 | MEDIUM | Security | `app/api/chat/route.ts` | Full message history forwarded without token budget |
| 6 | MEDIUM | Bug | `app/api/chat/route.ts` | `null` content in message array bypasses length guard |
| 7 | LOW | Bug | `components/DigitalTwin.tsx` | `onDone` in `useEffect` deps restarts typewriter on re-render |
| 8 | LOW | Performance | `components/Hero.tsx` | O(n²) particle-pair loop with unnecessary `Math.sqrt` every frame |
| 9 | LOW | Maintainability | Both API routes | Duplicate `getClientIp` function |
| 10 | LOW | Reliability | `components/MarketingAgent.tsx` | `navigator.clipboard` rejection silently swallowed |

---

## Finding 1 — HIGH: In-memory rate limit is bypassed in serverless

**File:** `lib/rate-limit.ts:3`

```ts
const store = new Map<string, Entry>();   // ← reset on every cold start
```

**Problem:**  
The rate-limit store is a module-level `Map` that lives only in the memory of a single Node.js process. On Vercel (and any serverless platform), each request may land on a different warm instance, and each cold start produces a completely fresh `Map`. A visitor who has used all 5 chat questions can get a fresh quota by triggering a cold start or being routed to a different instance. The 24-hour window is never actually enforced in production. This also exposes unlimited spend on OpenRouter/Groq.

**Action:**  
Replace the in-process store with a persistent edge store. Options:
- **Upstash Redis** (free tier, global) via `@upstash/ratelimit` — the simplest drop-in.
- **Vercel Marketplace** — provision a Redis-compatible store via `vercel marketplace`.
- Minimal example with `@upstash/ratelimit`:

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "24 h"),
});

export async function checkRateLimit(key: string) {
  const { success, remaining } = await ratelimit.limit(key);
  return { allowed: success, remaining };
}
```

---

## Finding 2 — HIGH: No fetch timeout on AI provider calls

**Files:** `app/api/chat/route.ts:51`, `app/api/marketing/route.ts:48`

```ts
const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  // no AbortSignal — hangs until the platform kills it
  ...
});
```

**Problem:**  
Neither API route sets a request timeout. If OpenRouter or Groq stalls (upstream outage, slow response, network issue), the serverless function occupies a slot for the full platform execution limit (10 s Hobby / 60 s Pro on Vercel), returns nothing to the browser, and accrues billed execution time. A slow upstream or deliberate slowloris attack causes cascading timeouts for legitimate visitors.

**Action:**  
Add `AbortSignal.timeout()` to both fetch calls:

```ts
const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  signal: AbortSignal.timeout(8000),   // abort after 8 s
  headers: { ... },
  body: JSON.stringify({ ... }),
});
```

Catch the `TimeoutError` / `AbortError` in the surrounding try/catch and return a `504` instead of letting the function hang.

---

## Finding 3 — HIGH: Rate limit is consumed before request validation

**File:** `app/api/chat/route.ts:23`, `app/api/marketing/route.ts:23`

```ts
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, remaining } = checkRateLimit(`${ip}:chat`, ...);  // ← consumed first
  if (!allowed) return 429;

  let messages: Message[];
  try {
    const body = await req.json();     // ← validation happens after
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error("invalid");
  } catch {
    return 400;
  }
```

**Problem:**  
A bot that sends 5 structurally invalid requests (empty body, wrong JSON, missing `messages`) will exhaust a visitor's 5-request daily chat quota without ever reaching the AI. Because `getClientIp` falls back to `"anonymous"` for requests without forwarded-for/real-ip headers, even a handful of such requests could lock out all anonymous visitors for 24 hours.

**Action:**  
Validate and parse the body first, return 400 for bad requests without touching the rate-limit counter. Move `checkRateLimit` to after the validation block:

```ts
export async function POST(req: NextRequest) {
  // 1. Parse and validate first
  let messages: Message[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // 2. Only now consume quota
  const ip = getClientIp(req);
  const { allowed, remaining } = checkRateLimit(`${ip}:chat`, DAILY_LIMIT, WINDOW_MS);
  if (!allowed) return NextResponse.json({ error: "Daily limit reached..." }, { status: 429 });
  ...
}
```

---

## Finding 4 — MEDIUM: Particle count is fixed at mount, not updated on resize

**File:** `components/Hero.tsx:24`

```ts
useEffect(() => {
  // ...
  const count = window.innerWidth < 768 ? 40 : 70;   // ← read once
  const particles = Array.from({ length: count }, () => ({ ... }));

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // ← count / particles array never updated
  };
  window.addEventListener("resize", resize, { passive: true });
  // ...
}, []);
```

**Problem:**  
`count` is captured once in the `useEffect` closure. The `resize` listener updates the canvas dimensions but the particle array stays fixed at the count computed at mount time. A user who loads the page on a phone in portrait (40 particles), then rotates to landscape, now has a canvas sized for desktop but only 40 particles — visibly sparse. Conversely, a tablet user undocking from a small monitor gets 70 particles on a narrow view.

**Action:**  
Move particle initialisation into the `resize` function and call it once on mount:

```ts
let particles: P[] = [];

const resize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const count = window.innerWidth < 768 ? 40 : 70;
  particles = Array.from({ length: count }, () => ({ ... }));
};
resize();
window.addEventListener("resize", resize, { passive: true });
```

---

## Finding 5 — MEDIUM: Full accumulated message history forwarded without token budget

**File:** `app/api/chat/route.ts:61`

```ts
body: JSON.stringify({
  model: MODEL,
  messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...messages],  // ← unbounded
  max_tokens: 300,
  ...
}),
```

**Problem:**  
Only the last message is checked for the 500-character limit (`chat/route.ts:42`), but the entire accumulated `history` is forwarded on every request. After 5 turns with near-500-char messages, the body can exceed 2,500 characters of user content plus a ~1,500-character system prompt. This inflates token consumption per request, can exceed the free-model's context window causing silent truncation, and is vulnerable to a crafty user who embeds long payloads across multiple messages to stay under the per-message cap.

**Action:**  
Cap the history sent to the API. Trim to the most recent N turns, or enforce a cumulative token budget. A simple approach:

```ts
const MAX_HISTORY_TURNS = 6;
const trimmedHistory = messages.slice(-MAX_HISTORY_TURNS);
// use trimmedHistory in the fetch body
```

---

## Finding 6 — MEDIUM: `null` message content bypasses the length guard

**File:** `app/api/chat/route.ts:41-44`

```ts
const lastMessage = messages[messages.length - 1];
if (!lastMessage?.content || String(lastMessage.content).length > 500) {
  return NextResponse.json({ error: "Message too long or empty." }, { status: 400 });
}
```

**Problem:**  
`messages` is typed as `Message[]` but comes from an untrusted request body. An element like `{ role: "user", content: null }` passes the array check (`Array.isArray` and `length > 0`). For the last message, `lastMessage.content` is `null` — which is falsy — so the `!lastMessage?.content` guard rejects it. **But** any earlier messages in the array can have `content: null`, and those are forwarded to OpenRouter without validation. OpenRouter will likely reject with a 400 that the server converts to a 502, leaking that the upstream was called.

**Action:**  
Validate every message, not just the last:

```ts
const isValidMessage = (m: unknown): m is Message =>
  typeof m === "object" && m !== null &&
  (m as Message).role === "user" || (m as Message).role === "assistant") &&
  typeof (m as Message).content === "string" &&
  (m as Message).content.length > 0 &&
  (m as Message).content.length <= 500;

if (!messages.every(isValidMessage)) {
  return NextResponse.json({ error: "Invalid message format." }, { status: 400 });
}
```

---

## Finding 7 — LOW: `onDone` in `useEffect` deps restarts typewriter on re-render

**File:** `components/DigitalTwin.tsx:36`

```ts
useEffect(() => {
  setDisplayed("");
  doneRef.current = false;
  let i = 0;
  const timer = setInterval(() => { ... }, 12);
  return () => clearInterval(timer);
}, [text, onDone]);   // ← onDone is a new arrow function reference on every render
```

```tsx
// Caller passes an inline lambda:
<TypewriterMsg text={msg.text} onDone={() => setActiveTypewriter(false)} />
```

**Problem:**  
`() => setActiveTypewriter(false)` is created fresh on every render of `DigitalTwin`. If the parent re-renders while the typewriter is mid-animation (e.g. from a state update), React sees a new `onDone` reference, the `useEffect` re-runs, `displayed` is reset to `""`, and the animation visibly restarts from the beginning. While the current disabled-input guard reduces the likelihood of user-triggered re-renders during animation, this is fragile and will break if any background state updates are added.

**Action:**  
Stabilise `onDone` with `useCallback` at the call site, or remove it from the deps array and access it via a ref inside the effect:

```ts
const onDoneRef = useRef(onDone);
useEffect(() => { onDoneRef.current = onDone; });

useEffect(() => {
  // ... interval logic, call onDoneRef.current?.() instead of onDone?.()
}, [text]);   // onDone no longer in deps
```

---

## Finding 8 — LOW: O(n²) particle loop with unnecessary `Math.sqrt` on every frame

**File:** `components/Hero.tsx:48-61`

```ts
for (let i = 0; i < particles.length; i++) {
  for (let j = i + 1; j < particles.length; j++) {
    const dx = particles[i].x - particles[j].x;
    const dy = particles[i].y - particles[j].y;
    const dist = Math.sqrt(dx * dx + dy * dy);   // ← unnecessary transcendental
    if (dist < 130) {
      ctx.strokeStyle = `rgba(236,173,10,${0.12 * (1 - dist / 130)})`;
      // ...
    }
  }
}
```

**Problem:**  
70 particles produce 2,415 pair checks × 60 fps = ~144,900 `Math.sqrt` calls per second. On mobile (40 particles) that's ~46,800/s. This is the dominant main-thread cost during the hero animation and causes measurable jank on mid-range phones, especially during scroll when the browser is also painting new content.

**Two quick wins (independent):**

1. **Skip sqrt for the threshold check.** Only compute `dist` (the float) when the pair actually passes the squared-distance test — needed for the alpha calculation:

```ts
const dist2 = dx * dx + dy * dy;
if (dist2 < 130 * 130) {
  const dist = Math.sqrt(dist2);
  ctx.strokeStyle = `rgba(236,173,10,${0.12 * (1 - dist / 130)})`;
  // ...
}
```

2. **Batch all lines into one path** instead of `beginPath/stroke` per pair:

```ts
ctx.beginPath();
for (...) {
  if (dist2 < 16900) {
    ctx.moveTo(particles[i].x, particles[i].y);
    ctx.lineTo(particles[j].x, particles[j].y);
  }
}
ctx.strokeStyle = "rgba(236,173,10,0.09)";
ctx.stroke();
```

---

## Finding 9 — LOW: `getClientIp` duplicated in both API routes

**Files:** `app/api/chat/route.ts:13-19`, `app/api/marketing/route.ts:12-18`

```ts
// Identical in both files:
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}
```

**Problem:**  
Any change to the IP extraction logic (e.g. adding `cf-connecting-ip` for Cloudflare, stripping port numbers, or adding IPv6 normalisation) must be applied in two files. One copy will eventually be missed, causing inconsistent rate-limiting or logging between the chat and marketing endpoints.

**Action:**  
Extract to `lib/ip.ts` and import in both routes:

```ts
// lib/ip.ts
import { NextRequest } from "next/server";
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}
```

---

## Finding 10 — LOW: `navigator.clipboard` rejection silently swallowed

**File:** `components/MarketingAgent.tsx:80`

```ts
navigator.clipboard.writeText(pitch).then(() => {
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
});
// no .catch()
```

**Problem:**  
`navigator.clipboard` requires a secure context (HTTPS) and user permission. In HTTP development, some browsers (Firefox strict mode, embedded webviews), or when the Permissions API denies access, `writeText` rejects. With no `.catch()`, the rejection is silently swallowed — the button appears to do nothing with no feedback to the user.

**Action:**  

```ts
navigator.clipboard.writeText(pitch)
  .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
  .catch(() => setError("Copy failed — please select and copy manually."));
```

---

## Additional Notes (non-blocking)

### `lib/cv.ts:92` — Dead fallback in `buildMarketingPrompt`

The `?? MARKETING_ROLE_PROMPTS.recruiter` fallback is unreachable from the API because the route validates the role first. Safe to remove; if `buildMarketingPrompt` is ever called from another context (test, script), the fallback hides invalid-role bugs silently.

### `lib/rate-limit.ts` — Store grows unbounded in long-running processes

Expired entries are replaced but never pruned. On a non-serverless deployment (e.g. local dev with `npm run dev`), every distinct IP creates a permanent map entry. Under automated IP rotation, this is a slow memory leak. Add periodic cleanup: `setInterval(() => { for (const [k, v] of store) { if (Date.now() > v.resetAt) store.delete(k); } }, WINDOW_MS)`.

### `components/DigitalTwin.tsx` — `remaining` initialised to hardcoded `5`

```ts
const [remaining, setRemaining] = useState(5);
```

If the user has already made requests in a previous page load, the display shows `5 questions` until the first API call corrects it. For a portfolio visitor this is confusing. Consider fetching the current count on mount, or starting with `null` and showing a spinner until the first response arrives.

---

## Environment Variable Checklist

After the partial Groq migration, two separate API keys are now required:

| Variable | Used by | Required |
|----------|---------|----------|
| `OPENROUTER_API_KEY` | `app/api/chat/route.ts` | Yes — Digital Twin |
| `GROQ_API_KEY` | `app/api/marketing/route.ts` | Yes — Marketing Agent |
| `SITE_URL` | `app/api/chat/route.ts` | Optional (defaults to `http://localhost:3000`) |

There is no `.env.example` in the repo. Add one to document these for future deploys.
