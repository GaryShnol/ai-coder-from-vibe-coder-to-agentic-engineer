"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BOOT_SEEN_KEY = "boot_seen_v1";

const STEPS = [
  "Initializing kernel",
  "Mounting /dev/portfolio",
  "Loading agent: gary.ai",
  "Starting render engine",
  "Establishing secure session",
  "Compiling experience graph",
  "Calibrating accent #ecad0a",
  "System ready",
];

function bootTimestamp(i: number) {
  return `[ ${((i + 1) * 0.0734).toFixed(4)} ]`;
}

export default function BootSequence() {
  const [phase, setPhase] = useState<"hidden" | "booting" | "ready" | "leaving">("hidden");
  const [shown, setShown] = useState(0);

  // Boot once per browser session — repeat visits within the same tab skip straight in.
  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(BOOT_SEEN_KEY) === "1";
    } catch {
      seen = false;
    }
    if (!seen) {
      setPhase("booting");
      document.documentElement.style.overflow = "hidden";
    }
  }, []);

  useEffect(() => {
    if (phase !== "booting") return;
    if (shown >= STEPS.length) {
      const t = setTimeout(() => setPhase("ready"), 380);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((s) => s + 1), 150 + Math.random() * 190);
    return () => clearTimeout(t);
  }, [phase, shown]);

  useEffect(() => {
    if (phase !== "ready") return;
    const finish = () => {
      try {
        sessionStorage.setItem(BOOT_SEEN_KEY, "1");
      } catch {
        // private browsing or storage disabled — boot will simply replay next visit
      }
      document.documentElement.style.overflow = "";
      setPhase("leaving");
    };
    window.addEventListener("keydown", finish);
    window.addEventListener("pointerdown", finish);
    const fallback = setTimeout(finish, 3200);
    return () => {
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
      clearTimeout(fallback);
    };
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <AnimatePresence>
      {phase !== "leaving" && (
        <motion.div
          key="boot"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9000,
            background: "#010e1f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div style={{ width: "100%", maxWidth: "34rem" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 2.1 }}>
              {STEPS.slice(0, shown).map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "0.85rem" }}>
                  <span style={{ color: "#888888", flexShrink: 0 }}>{bootTimestamp(i)}</span>
                  <span style={{ flex: 1, color: "rgba(232,237,242,0.7)" }}>{step}</span>
                  <span style={{ color: "#4ade80", fontWeight: 700 }}>[OK]</span>
                </div>
              ))}
            </div>
            {phase === "ready" && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                style={{ marginTop: "1.75rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#ecad0a" }}
              >
                &gt; welcome. press any key to enter<span className="blink">_</span>
              </motion.p>
            )}
            <div style={{ marginTop: "2rem", height: "2px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${Math.min(100, (shown / STEPS.length) * 100)}%` }}
                transition={{ duration: 0.2 }}
                style={{ height: "100%", background: "#ecad0a" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
