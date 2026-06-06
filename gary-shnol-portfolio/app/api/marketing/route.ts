import { NextRequest, NextResponse } from "next/server";
import { buildMarketingPrompt, MARKETING_ROLE_PROMPTS } from "@/lib/cv";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/ip";

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const MODEL = "llama-3.3-70b-versatile";
const DAILY_LIMIT = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000;

const VALID_ROLES = Object.keys(MARKETING_ROLE_PROMPTS);

export async function POST(req: NextRequest) {
  // Finding 3: validate input BEFORE consuming rate-limit quota
  let role: string;
  try {
    const body = await req.json();
    role = body.role;
    if (!role || !VALID_ROLES.includes(role)) throw new Error("invalid role");
  } catch {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  // Finding 3: rate-limit check after validation
  const ip = getClientIp(req);
  const { allowed, remaining } = await checkRateLimit(`${ip}:marketing`, DAILY_LIMIT, WINDOW_MS);

  if (!allowed) {
    return NextResponse.json(
      { error: "Daily limit reached. Contact Gary directly: shnol.garik@gmail.com" },
      { status: 429 }
    );
  }

  const systemPrompt = buildMarketingPrompt(role);

  try {
    // Finding 2: add fetch timeout
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
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
      const errBody = await res.text().catch(() => "(unreadable)");
      console.error("Groq error:", res.status, errBody);
      return NextResponse.json({ error: "AI service error." }, { status: 502 });
    }

    const data = await res.json();
    const pitch: string = data.choices?.[0]?.message?.content ?? "";

    if (!pitch) {
      return NextResponse.json({ error: "Empty response from AI." }, { status: 502 });
    }

    return NextResponse.json({ pitch: pitch.trim(), remaining });
  } catch (err) {
    // Finding 2: handle timeout specifically
    if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
      return NextResponse.json({ error: "AI service timed out." }, { status: 504 });
    }
    console.error("Marketing error:", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
