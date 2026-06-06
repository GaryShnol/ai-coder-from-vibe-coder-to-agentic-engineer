import { NextRequest, NextResponse } from "next/server";
import { CHAT_SYSTEM_PROMPT } from "@/lib/cv";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/ip";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
const MODEL = "google/gemma-3-27b-it:free";
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
  const { allowed, remaining } = checkRateLimit(`${ip}:chat`, DAILY_LIMIT, WINDOW_MS);

  if (!allowed) {
    return NextResponse.json(
      { error: "Daily limit reached. Contact Gary directly: shnol.garik@gmail.com" },
      { status: 429 }
    );
  }

  // Finding 5: cap history to last 6 turns
  const trimmedMessages = messages.slice(-6);

  try {
    // Finding 2: add fetch timeout
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": SITE_URL,
        "X-Title": "Gary Shnol Digital Twin",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...trimmedMessages],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("OpenRouter error:", res.status, err);
      return NextResponse.json({ error: "AI service error." }, { status: 502 });
    }

    const data = await res.json();
    const reply: string = data.choices?.[0]?.message?.content ?? "";

    if (!reply) {
      return NextResponse.json({ error: "Empty response from AI." }, { status: 502 });
    }

    return NextResponse.json({ reply, remaining });
  } catch (err) {
    // Finding 2: handle timeout specifically
    if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
      return NextResponse.json({ error: "AI service timed out." }, { status: 504 });
    }
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
