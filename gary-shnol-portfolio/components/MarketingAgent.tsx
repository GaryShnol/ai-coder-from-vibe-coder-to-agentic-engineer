"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const ROLES = [
  { id: "recruiter", label: "Recruiter / HR", desc: "Hiring manager perspective" },
  { id: "cto", label: "CTO / Tech Lead", desc: "Technical decision maker" },
  { id: "founder", label: "Startup Founder", desc: "Builder & ambitious" },
  { id: "engineer", label: "Fellow Engineer", desc: "Peer-to-peer" },
];

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!text) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
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

  const generate = async (role: string) => {
    if (loading) return;
    setSelected(role);
    setLoading(true);
    setPitch("");
    setError("");
    setCopied(false);

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

              {error && !loading && (
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
                    <TypewriterText text={pitch} />
                  </p>
                  <button
                    onClick={copyPitch}
                    className="btn-ghost"
                    style={{ fontSize: "0.6rem", padding: "0.4rem 1rem" }}
                  >
                    {copied ? "Copied!" : "Copy Pitch"}
                  </button>
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
