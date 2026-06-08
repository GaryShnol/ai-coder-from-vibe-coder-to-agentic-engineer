"use client";

import { useCallback, useRef } from "react";
import { motion, useInView } from "framer-motion";

const TILT_MAX_DEG = 7;

/** Subtle 3D tilt-toward-cursor — driven imperatively via ref so it never fights framer-motion's reveal transform on the parent. */
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateX(${(-py * TILT_MAX_DEG).toFixed(2)}deg) rotateY(${(px * TILT_MAX_DEG).toFixed(2)}deg)`;
    el.style.setProperty("--glow-x", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--glow-y", `${(py + 0.5) * 100}%`);
    el.style.setProperty("--glow-o", "1");
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    el.style.setProperty("--glow-o", "0");
  }, []);

  return { ref, onMove, onLeave };
}

type Panel = {
  label: string;
  rows: { key: string; desc?: string }[];
};

const PANELS: Panel[] = [
  {
    label: "Backend & Integration",
    rows: [
      { key: "java", desc: "primary · 5+ yrs enterprise" },
      { key: "python", desc: "fastapi · ml · scripting" },
      { key: "fastapi", desc: "async REST APIs" },
      { key: "rest_apis", desc: "design & implementation" },
      { key: "microservices", desc: "enterprise architecture" },
      { key: "web_services", desc: "3rd-party integrations" },
    ],
  },
  {
    label: "Data & Streaming",
    rows: [
      { key: "kafka", desc: "millions of events / day" },
      { key: "postgresql", desc: "production workloads" },
      { key: "ipaas", desc: "enterprise integration" },
      { key: "big_data", desc: "pipeline design & ops" },
      { key: "data_pipelines", desc: "end-to-end processing" },
    ],
  },
  {
    label: "Generative AI & LLMs",
    rows: [
      { key: "llm_apis", desc: "openai · anthropic · groq" },
      { key: "prompt_engineering", desc: "system design & tuning" },
      { key: "rag", desc: "retrieval-augmented generation" },
      { key: "embeddings", desc: "semantic search" },
      { key: "langchain / langgraph", desc: "agent orchestration" },
      { key: "multi_agent_systems", desc: "pipeline architecture" },
    ],
  },
  {
    label: "ML Vision & Infrastructure",
    rows: [
      { key: "yolov4", desc: "+23% accuracy achieved" },
      { key: "object_detection", desc: "real-time drone feed" },
      { key: "jenkins_cicd", desc: "monitoring, pipelines" },
      { key: "git", desc: "version control" },
      { key: "android", desc: "java + dji sdk" },
      { key: "tcp_ip / scapy", desc: "networks, protocols" },
    ],
  },
];

const CERTS = [
  "LangGraph: Develop LLM Powered AI Agents (Udemy · Jun 2026)",
  "Java: Lambdas & Streams",
  "Java with JSON",
  "Data Structures & Algorithms in Java",
  "Postman Essential Training",
  "Web Development Bootcamp",
];

function SkillPanel({ panel, index }: { panel: Panel; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const tilt = useTilt();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{ background: "#010e1f" }}
    >
      <div
        ref={tilt.ref}
        onMouseMove={tilt.onMove}
        onMouseLeave={tilt.onLeave}
        style={{
          position: "relative",
          padding: "1.25rem 2rem 2rem",
          transformStyle: "preserve-3d",
          transition: "transform 0.4s cubic-bezier(0.23,1,0.32,1)",
          willChange: "transform",
          ["--glow-x" as string]: "50%",
          ["--glow-y" as string]: "50%",
          ["--glow-o" as string]: "0",
        }}
      >
        {/* Cursor-tracking glow — fades in on hover, follows the tilt */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: "var(--glow-o)",
            transition: "opacity 0.3s ease",
            background: "radial-gradient(360px circle at var(--glow-x) var(--glow-y), rgba(236,173,10,0.07), transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <p style={{ position: "relative", fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#ecad0a", borderBottom: "1px solid rgba(236,173,10,0.2)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
          &gt;&gt; {panel.label}
        </p>
        {panel.rows.map((row) => (
          <div key={row.key} className="status-row" style={{ position: "relative" }}>
            <span style={{ color: "#888888", minWidth: "14rem" }}>&nbsp;&nbsp;{row.key}</span>
            <span style={{ color: "#4ade80", fontWeight: 700, flexShrink: 0 }}>[OK]</span>
            {row.desc && (
              <span style={{ color: "#888888", fontSize: "0.7rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                &nbsp;{row.desc}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Skills() {
  const headRef = useRef<HTMLDivElement>(null);
  const headInView = useInView(headRef, { once: true, margin: "-60px" });

  const certRef = useRef<HTMLDivElement>(null);
  const certInView = useInView(certRef, { once: true, margin: "-60px" });

  return (
    <section id="skills" style={{ padding: "6rem 1.5rem", background: "#010e1f" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="sec-label">Tech Stack</span>
          <h2 style={{ fontWeight: 900, color: "#ffffff", fontSize: "clamp(2rem,5vw,3.5rem)", lineHeight: 1, marginBottom: "0.75rem" }}>
            SYSTEM<br />
            <span style={{ color: "#ecad0a", fontWeight: 300, fontStyle: "italic" }}>STATUS</span>
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", color: "#888888", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "3rem" }}>
            running diagnostics on gary@dev-machine...
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1px",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {PANELS.map((panel, i) => (
            <SkillPanel key={i} panel={panel} index={i} />
          ))}
        </div>

        <motion.div
          ref={certRef}
          initial={{ opacity: 0, y: 20 }}
          animate={certInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          style={{ marginTop: "1.5rem", border: "1px solid rgba(255,255,255,0.05)", padding: "1.5rem 2rem" }}
        >
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888888", marginBottom: "1rem" }}>
            &gt;&gt; Certifications loaded
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {CERTS.map((c) => (
              <span
                key={c}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  border: "1px solid rgba(32,157,215,0.3)",
                  color: "#209dd7",
                  padding: "0.2rem 0.75rem",
                  letterSpacing: "0.05em",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
