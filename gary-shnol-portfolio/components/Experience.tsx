"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Role = {
  company: string;
  title: string;
  from: string;
  to: string;
  duration: string;
  bullets: string[];
  chips: string[];
  fading?: boolean;
};

const ROLES: Role[] = [
  {
    company: "Amdocs",
    title: "Back End Developer",
    from: "Aug 2021",
    to: "Present",
    duration: "5+ years",
    bullets: [
      "Manage big data operations at enterprise scale using an iPaaS platform",
      "Kafka for event streaming, collection, processing, and cross-system integration",
      "Java backend: business logic, data processing, REST web services with PostgreSQL",
      "Built e-commerce product integrating nine third-party systems end-to-end",
      "Jenkins CI/CD monitoring jobs, peer code reviews, technical onboarding",
    ],
    chips: ["Java","Python", "Kafka", "PostgreSQL", "REST APIs", "iPaaS", "Jenkins"],
  },
  {
    company: "SCE Shamoon College of Engineering",
    title: "Researcher",
    from: "Oct 2019",
    to: "Aug 2021",
    duration: "1 yr 11 mos",
    bullets: [
      "Led software project for Israeli Ministry of Agriculture: drone-based bee tracking",
      "Implemented YOLOv4 object detection for real-time processing on live drone feed",
      "Improved model accuracy by 23% through systematic production testing and iteration",
      "Built Android app from scratch (Java, DJI Mobile SDK) and Python backend server",
    ],
    chips: ["Python", "YOLOv4", "Android", "Java", "DJI SDK", "ML"],
  },
  {
    company: "Cyber Education Center",
    title: "Networks Instructor",
    from: "Sep 2019",
    to: "Aug 2021",
    duration: "2 years",
    bullets: [
      "Taught advanced networking in a computer and cyber excellence program",
      "Curriculum: TCP/IP layer model, protocols, Python networking (Sockets, Scapy)",
    ],
    chips: ["TCP/IP", "Python", "Networking", "Scapy"],
    fading: true,
  },
];

function RoleCard({ role, index }: { role: Role; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "relative",
        paddingLeft: "2rem",
        paddingBottom: index < ROLES.length - 1 ? "4rem" : 0,
        paddingTop: index > 0 ? "4rem" : 0,
        borderBottom: index < ROLES.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
      }}
    >
      {/* Timeline rule */}
      <div
        className="timeline-rule"
        style={role.fading ? { background: "linear-gradient(to bottom, rgba(236,173,10,0.4), transparent)" } : undefined}
      />
      {/* Dot */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: index > 0 ? "4rem" : 0,
          width: "8px",
          height: "8px",
          background: "#ecad0a",
          transform: "translateX(-3.5px)",
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }} className="md:grid-cols-4">
        {/* Date col */}
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888888", marginBottom: "0.2rem" }}>
            {role.from}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888888", marginBottom: "0.2rem" }}>
            &mdash; {role.to}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#ecad0a", marginTop: "0.5rem" }}>
            {role.duration}
          </p>
        </div>

        {/* Content */}
        <div style={{ gridColumn: "span 3" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#ecad0a", marginBottom: "0.25rem" }}>
            {role.company}
          </p>
          <p style={{ color: "#ffffff", fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.01em", marginBottom: "1.25rem" }}>
            {role.title}
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem 0", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {role.bullets.map((b, i) => (
              <li key={i} style={{ display: "flex", gap: "0.75rem", fontSize: "0.875rem", lineHeight: 1.7, color: "rgba(232,237,242,0.65)" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "#ecad0a", flexShrink: 0, marginTop: "0.2rem" }}>&gt;&gt;</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {role.chips.map((c) => (
              <span key={c} className="chip">{c}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Experience() {
  const headRef = useRef<HTMLDivElement>(null);
  const headInView = useInView(headRef, { once: true, margin: "-60px" });

  return (
    <section id="experience" style={{ padding: "6rem 1.5rem", background: "#021539" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="sec-label">Experience</span>
          <h2
            style={{
              fontWeight: 900,
              color: "#ffffff",
              fontSize: "clamp(2rem,5vw,3.5rem)",
              lineHeight: 1,
              marginBottom: "5rem",
            }}
          >
            WHERE I<br />
            <span style={{ color: "#ecad0a", fontWeight: 300, fontStyle: "italic" }}>BUILT</span> THINGS
          </h2>
        </motion.div>

        {ROLES.map((role, i) => (
          <RoleCard key={i} role={role} index={i} />
        ))}
      </div>
    </section>
  );
}
