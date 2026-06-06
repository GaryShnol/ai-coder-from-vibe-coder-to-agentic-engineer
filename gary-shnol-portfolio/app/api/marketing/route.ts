import { NextRequest, NextResponse } from "next/server";
import { buildMarketingPrompt, MARKETING_ROLE_PROMPTS } from "@/lib/cv";
import { checkRateLimit } from "@/lib/rate-limit";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
const MODEL = "google/gemma-3-27b-it:free";
const DAILY_LIMIT = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000;

const VALID_ROLES = Object.keys(MARKETING_ROLE_PROMPTS);

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, remaining } = checkRateLimit(`${ip}:marketing`, DAILY_LIMIT, WINDOW_MS);

  if (!allowed) {
    return NextResponse.json(
      { error: "Daily limit reached. Contact Gary directly: shnol.garik@gmail.com" },
      { status: 429 }
    );
  }

  let role: string;
  try {
    const body = await req.json();
    role = body.role;
    if (!role || !VALID_ROLES.includes(role)) throw new Error("invalid role");
  } catch {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const systemPrompt = buildMarketingPrompt(role);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": SITE_URL,
        "X-Title": "Gary Shnol Marketing Agent",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Write the pitch for a ${role}.` },
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      console.error("OpenRouter marketing error:", res.status);
      return NextResponse.json({ error: "AI service error." }, { status: 502 });
    }

    const data = await res.json();
    const pitch: string = data.choices?.[0]?.message?.content ?? "";

    if (!pitch) {
      return NextResponse.json({ error: "Empty response from AI." }, { status: 502 });
    }

    return NextResponse.json({ pitch: pitch.trim(), remaining });
  } catch (err) {
    console.error("Marketing error:", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
