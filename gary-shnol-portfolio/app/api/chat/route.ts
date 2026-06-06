import { NextRequest, NextResponse } from "next/server";
import { CHAT_SYSTEM_PROMPT } from "@/lib/cv";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/ip";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

// Multiple providers so a single account's rate limit never blocks everything.
// OpenRouter free models share one 50 msg/day account quota — Groq is a separate provider.
type Provider = {
  url: string;
  model: string;
  authHeader: () => string;
  extraHeaders?: Record<string, string>;
};

const PROVIDERS: Provider[] = [
  {
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "google/gemma-4-26b-a4b-it:free",
    authHeader: () => `Bearer ${OPENROUTER_API_KEY}`,
    extraHeaders: { "HTTP-Referer": SITE_URL, "X-Title": "Gary Shnol Digital Twin" },
  },
  {
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "nvidia/nemotron-3-super-120b-a12b:free",
    authHeader: () => `Bearer ${OPENROUTER_API_KEY}`,
    extraHeaders: { "HTTP-Referer": SITE_URL, "X-Title": "Gary Shnol Digital Twin" },
  },
  {
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.1-8b-instant",   // Groq free tier — separate rate limits
    authHeader: () => `Bearer ${GROQ_API_KEY}`,
  },
];

const DAILY_LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  // Finding 3: validate input BEFORE consuming rate-limit quota
  let messages: Message[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error("invalid");
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Finding 6: every message must have non-empty string content
  if (!messages.every((m) => typeof m.content === "string" && m.content.length > 0)) {
    return NextResponse.json({ error: "Invalid message format." }, { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage?.content || String(lastMessage.content).length > 500) {
    return NextResponse.json({ error: "Message too long or empty." }, { status: 400 });
  }

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  // Finding 3: rate-limit check after validation
  const ip = getClientIp(req);
  const { allowed, remaining } = await checkRateLimit(`${ip}:chat`, DAILY_LIMIT, WINDOW_MS);

  if (!allowed) {
    return NextResponse.json(
      { error: "Daily limit reached. Contact Gary directly: shnol.garik@gmail.com" },
      { status: 429 }
    );
  }

  // Finding 5: cap history to last 6 turns
  const trimmedMessages = messages.slice(-6);

  for (const provider of PROVIDERS) {
    // Skip Groq if key not configured
    if (provider.url.includes("groq") && !GROQ_API_KEY) continue;

    try {
      const res = await fetch(provider.url, {
        method: "POST",
        signal: AbortSignal.timeout(8000),
        headers: {
          Authorization: provider.authHeader(),
          "Content-Type": "application/json",
          ...provider.extraHeaders,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...trimmedMessages],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (res.status === 429) {
        console.warn(`${provider.model} rate-limited, trying next provider...`);
        continue;
      }

      if (!res.ok) {
        const err = await res.text().catch(() => "");
        console.error(`AI error (${provider.model}):`, res.status, err);
        continue;
      }

      const data = await res.json();
      const reply: string = data.choices?.[0]?.message?.content ?? "";

      if (!reply) continue;

      return NextResponse.json({ reply, remaining });
    } catch (err) {
      if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
        console.warn(`${provider.model} timed out, trying next provider...`);
        continue;
      }
      console.error(`Chat error (${provider.model}):`, err);
    }
  }

  return NextResponse.json({ error: "All AI models are currently unavailable. Please try again later." }, { status: 502 });
}
