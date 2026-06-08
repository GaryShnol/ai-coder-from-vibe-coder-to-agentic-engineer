import { NextRequest, NextResponse } from "next/server";
import { logCtaEvent } from "@/lib/event-log";
import type { CtaEventRequest } from "@/lib/cta-types";

const QUESTION_MAX_LENGTH = 200;

const VALID_SURFACES = ["marketing", "twin"];
const VALID_EVENTS = ["shown", "click"];

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid surface." }, { status: 400 });
  }

  const candidate = body as Partial<CtaEventRequest> | null | undefined;

  if (!VALID_SURFACES.includes(candidate?.surface as string)) {
    return NextResponse.json({ error: "Invalid surface." }, { status: 400 });
  }
  const surface = candidate!.surface as CtaEventRequest["surface"];

  if (!VALID_EVENTS.includes(candidate?.event as string)) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }
  const event = candidate!.event as CtaEventRequest["event"];

  // role/question are always-optional regardless of surface — just validate
  // their type when present and pass through whatever is given.
  if (candidate?.role !== undefined && typeof candidate.role !== "string") {
    return NextResponse.json({ error: "Invalid context." }, { status: 400 });
  }
  if (candidate?.question !== undefined && typeof candidate.question !== "string") {
    return NextResponse.json({ error: "Invalid context." }, { status: 400 });
  }
  const role = candidate?.role;
  let question = candidate?.question;
  if (typeof question === "string" && question.length > QUESTION_MAX_LENGTH) {
    question = question.slice(0, QUESTION_MAX_LENGTH);
  }

  try {
    await logCtaEvent(surface, event, { role, question });
  } catch (err) {
    // logCtaEvent never throws by contract, but guard anyway: a broken
    // logging pipeline must never look like a broken feature to the frontend.
    console.error("CTA event route error:", err);
  }

  return NextResponse.json({ ok: true });
}
