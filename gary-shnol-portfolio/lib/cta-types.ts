export type CtaSurface = "marketing" | "twin";
export type CtaEventType = "shown" | "click";

export type CtaEventRequest = {
  surface: CtaSurface;
  event: CtaEventType;
  role?: string;
  question?: string;
};

export type CtaEventResponse = { ok: true } | { error: string };
