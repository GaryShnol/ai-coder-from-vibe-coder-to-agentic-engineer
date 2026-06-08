"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type { CtaEventRequest, CtaEventType } from "@/lib/cta-types";

const CTA_SEEN_KEY = "cta_seen_marketing";
const CONTACT_EMAIL = "shnol.garik@gmail.com";

function logCtaEvent(payload: CtaEventRequest) {
  try {
    fetch("/api/cta-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // never let CTA logging break the UI
  }
}

function fireMarketingCtaEvent(event: CtaEventType, role: string | null) {
  const payload: CtaEventRequest =
    role != null
      ? { surface: "marketing", event, role }
      : { surface: "marketing", event };
  logCtaEvent(payload);
}

function hasSeenMarketingCta(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(CTA_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markMarketingCtaSeen() {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(CTA_SEEN_KEY, "1");
  } catch {
    // ignore — private browsing or storage disabled
  }
}

const ROLES = [
  { id: "recruiter", label: "Recruiter / HR", desc: "Hiring manager perspective" },
  { id: "cto", label: "CTO / Tech Lead", desc: "Technical decision maker" },
  { id: "founder", label: "Startup Founder", desc: "Builder & ambitious" },
  { id: "engineer", label: "Fellow Engineer", desc: "Peer-to-peer" },
];

function TypewriterText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);

  // Keep ref in sync without retriggering the typing effect
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (!text) return;
    doneRef.current = false;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        if (!doneRef.current) {
          doneRef.current = true;
          onDoneRef.current?.();
        }
      }
    }, 18);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="blink" style={{ color: "#ecad0a" }}>_</span>
      )}
    </span>
  );
}

export default function MarketingAgent() {
  const headRef = useRef<HTMLDivElement>(null);
  const headInView = useInView(headRef, { once: true, margin: "-60px" });

  const [selected, setSelected] = useState<string | null>(null);
  const [pitch, setPitch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [pitchTypingDone, setPitchTypingDone] = useState(false);
  // Lazy-init from sessionStorage: safe from hydration mismatches because the CTA this
  // flag gates is only ever rendered after a client-only pitch generation completes
  // (never during SSR / initial hydration).
  const [ctaSeen, setCtaSeen] = useState(() => hasSeenMarketingCta());

  const generate = async (role: string) => {
    if (loading) return;
    setSelected(role);
    setLoading(true);
    setPitch("");
    setError("");
    setCopied(false);
    setPitchTypingDone(false);

    try {
      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        if (res.status === 429) setRemaining(0);
      } else {
        setPitch(data.pitch ?? "");
        if (typeof data.remaining === "number") setRemaining(data.remaining);
      }
    } catch {
      setError("Connection failed. Check your network.");
    } finally {
      setLoading(false);
    }
  };

  const copyPitch = () => {
    if (!pitch) return;
    navigator.clipboard.writeText(pitch)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setError("Copy failed — please select and copy manually."));
  };

  return (
    <section id="marketing" style={{ padding: "6rem 1.5rem", background: "#010e1f" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="sec-label">Marketing Agent</span>
          <h2 style={{ fontWeight: 900, color: "#ffffff", fontSize: "clamp(2rem,5vw,3.5rem)", lineHeight: 1, marginBottom: "0.75rem" }}>
            GARY IN<br />
            <span style={{ color: "#ecad0a", fontWeight: 300, fontStyle: "italic" }}>60 SECONDS</span>
          </h2>
          <p style={{ color: "rgba(232,237,242,0.5)", fontSize: "0.875rem", maxWidth: "28rem", lineHeight: 1.7, fontWeight: 300, marginBottom: "3rem" }}>
            Select who you are. The AI writes Gary&apos;s pitch tailored specifically for your perspective.
          </p>
        </motion.div>

        {/* Role selector */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "2.5rem" }}>
          {ROLES.map((role, i) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={headInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.45 }}
              onClick={() => generate(role.id)}
              disabled={loading || remaining === 0}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "0.6rem 1.25rem",
                border: selected === role.id ? "1px solid #ecad0a" : "1px solid rgba(255,255,255,0.1)",
                background: selected === role.id ? "rgba(236,173,10,0.1)" : "transparent",
                color: selected === role.id ? "#ecad0a" : "#888888",
                transition: "all 0.2s ease",
                opacity: loading && selected !== role.id ? 0.4 : 1,
              }}
            >
              {role.label}
            </motion.button>
          ))}
        </div>

        {/* Output panel */}
        <div
          style={{
            maxWidth: "44rem",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#021539",
            minHeight: "9rem",
          }}
        >
          {/* Chrome bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#032147" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888888" }}>
              gary@marketing-agent &mdash; pitch generator
            </span>
            {remaining !== null && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: remaining === 0 ? "#f87171" : "#888888" }}>
                {remaining === 0 ? "limit reached" : `${remaining} left today`}
              </span>
            )}
          </div>

          <div style={{ padding: "1.5rem 1.5rem 1.25rem" }}>
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#ecad0a" }}>
                    &gt; generating pitch
                  </span>
                  <span className="blink" style={{ fontFamily: "var(--font-mono)", color: "#ecad0a" }}>_</span>
                </motion.div>
              )}

              {error && !loading && remaining === 0 && (
                <motion.div
                  key="rate-limited"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <RateLimitedCta
                    selected={selected}
                    ctaSeen={ctaSeen}
                    onFirstShown={() => setCtaSeen(true)}
                  />
                </motion.div>
              )}

              {error && !loading && remaining !== 0 && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#f87171" }}
                >
                  &gt; {error}
                </motion.p>
              )}

              {pitch && !loading && !error && (
                <motion.div
                  key="pitch"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#888888", marginBottom: "0.75rem" }}>
                    &gt; pitch for {ROLES.find((r) => r.id === selected)?.label}
                  </p>
                  <p style={{ fontSize: "0.95rem", lineHeight: 1.75, color: "rgba(232,237,242,0.85)", marginBottom: "1.25rem" }}>
                    <TypewriterText text={pitch} onDone={() => setPitchTypingDone(true)} />
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
                    <button
                      onClick={copyPitch}
                      className="btn-ghost"
                      style={{ fontSize: "0.6rem", padding: "0.4rem 1rem" }}
                    >
                      {copied ? "Copied!" : "Copy Pitch"}
                    </button>
                    {pitchTypingDone && (
                      <MarketingCta
                        selected={selected}
                        ctaSeen={ctaSeen}
                        onFirstShown={() => setCtaSeen(true)}
                      />
                    )}
                  </div>
                </motion.div>
              )}

              {!pitch && !loading && !error && (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "rgba(136,136,136,0.5)" }}
                >
                  &gt; select a role above to generate a tailored pitch_
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Primary CTA action: a pre-filled mailto requesting a 15-minute call, carrying the role as context. */
function buildBookingHref(role: string | null): string {
  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? null;
  const subject = roleLabel ? `15 min re: ${roleLabel} pitch` : "15 min — Gary's pitch generator";
  const body = roleLabel
    ? `Hi Gary,\n\nI just read the AI-generated pitch tailored for "${roleLabel}" on your site — could we grab 15 minutes on a call to continue the conversation?\n`
    : `Hi Gary,\n\nI just tried your pitch generator — could we grab 15 minutes on a call to continue the conversation?\n`;
  const params = new URLSearchParams({ subject, body });
  return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
}

/** Quiet secondary action: plain, unparameterized mailto (matches the site's existing "contact directly" links). */
function buildPlainMailtoHref(): string {
  return `mailto:${CONTACT_EMAIL}`;
}

function MarketingCta({
  selected,
  ctaSeen,
  onFirstShown,
}: {
  selected: string | null;
  ctaSeen: boolean;
  onFirstShown: () => void;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (ctaSeen || firedRef.current) return;
    firedRef.current = true;
    fireMarketingCtaEvent("shown", selected);
    markMarketingCtaSeen();
    onFirstShown();
  }, [ctaSeen, selected, onFirstShown]);

  const handleClick = () => {
    fireMarketingCtaEvent("click", selected);
  };

  if (ctaSeen) {
    return (
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#888888" }}>
        &gt; (calendar link above &uarr;)
      </span>
    );
  }

  const roleLabel = ROLES.find((r) => r.id === selected)?.label ?? "you";
  const href = buildBookingHref(selected);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      aria-live="polite"
      style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", lineHeight: 1.8 }}
    >
      <p style={{ color: "#ecad0a", marginBottom: "0.25rem" }}>
        &gt; pitch for {roleLabel} &mdash; generated
      </p>
      <p style={{ color: "#ecad0a" }}>
        &gt; recommend: skip the back-and-forth &mdash;{" "}
        <a
          href={href}
          onClick={handleClick}
          className="hover-line"
          aria-label={`Schedule 15 minutes with Gary to discuss this ${roleLabel} pitch`}
          title={`book 15 min — re: ${roleLabel} pitch`}
          style={{ color: "#209dd7" }}
        >
          grab 15 min on Gary&apos;s calendar &rarr;
        </a>
      </p>
    </motion.div>
  );
}

function RateLimitedCta({
  selected,
  ctaSeen,
  onFirstShown,
}: {
  selected: string | null;
  ctaSeen: boolean;
  onFirstShown: () => void;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (ctaSeen || firedRef.current) return;
    firedRef.current = true;
    fireMarketingCtaEvent("shown", selected);
    markMarketingCtaSeen();
    onFirstShown();
  }, [ctaSeen, selected, onFirstShown]);

  const handleClick = () => {
    fireMarketingCtaEvent("click", selected);
  };

  const href = buildBookingHref(selected);

  if (ctaSeen) {
    return (
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", lineHeight: 1.8 }}>
        <p style={{ color: "#f87171", marginBottom: "0.35rem" }}>
          &gt; daily limit reached &mdash; that&apos;s the cost-control talking, not me
        </p>
        <p>
          <a href={href} onClick={handleClick} className="hover-line" style={{ color: "#888888", fontSize: "0.6rem" }}>
            &gt; (calendar link above &uarr;)
          </a>
        </p>
      </div>
    );
  }

  return (
    <div aria-live="polite" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", lineHeight: 1.8 }}>
      <p style={{ color: "#f87171", marginBottom: "0.35rem" }}>
        &gt; daily limit reached &mdash; that&apos;s the cost-control talking, not me
      </p>
      <p style={{ color: "#ecad0a", marginBottom: "0.35rem" }}>
        &gt; next: skip the queue &mdash;{" "}
        <a
          href={href}
          onClick={handleClick}
          className="hover-line"
          aria-label="Schedule 15 minutes with Gary on his calendar"
          title="book 15 min on Gary's calendar"
          style={{ color: "#209dd7" }}
        >
          book 15 min on Gary&apos;s calendar
        </a>
      </p>
      <p style={{ color: "#888888", fontSize: "0.7rem" }}>
        &gt; or email{" "}
        <a href={buildPlainMailtoHref()} className="hover-line" style={{ color: "#888888" }}>
          {CONTACT_EMAIL}
        </a>{" "}
        directly
      </p>
    </div>
  );
}
