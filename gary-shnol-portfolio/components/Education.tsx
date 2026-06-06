"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const DEGREES = [
  {
    period: "2019 – 2022",
    level: "Master of Science",
    field: "Computer Software Engineering",
    school: "SCE Shamoon College of Engineering",
  },
  {
    period: "2013 – 2018",
    level: "Bachelor of Science",
    field: "Software Engineering",
    school: "SCE Shamoon College of Engineering",
  },
];

export default function Education() {
  const headRef = useRef<HTMLDivElement>(null);
  const headInView = useInView(headRef, { once: true, margin: "-60px" });

  return (
    <section id="education" style={{ padding: "6rem 1.5rem", background: "#021539" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="sec-label">Education</span>
          <h2 style={{ fontWeight: 900, color: "#ffffff", fontSize: "clamp(2rem,5vw,3.5rem)", lineHeight: 1, marginBottom: "4rem" }}>
            ACADEMIC<br />
            <span style={{ color: "#ecad0a", fontWeight: 300, fontStyle: "italic" }}>FOUNDATION</span>
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1px", background: "rgba(255,255,255,0.04)" }}>
          {DEGREES.map((deg, i) => {
            const ref = useRef<HTMLDivElement>(null);
            const inView = useInView(ref, { once: true, margin: "-60px" });
            return (
              <motion.div
                key={i}
                ref={ref}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: i * 0.12 }}
                style={{ position: "relative", padding: "2.5rem 2rem 2.5rem 3rem", background: "#021539" }}
              >
                <div className="edu-bar" />
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888888", marginBottom: "1rem" }}>
                  {deg.period}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#ecad0a", marginBottom: "0.75rem" }}>
                  {deg.level}
                </p>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.5rem" }}>
                  {deg.field}
                </h3>
                <p style={{ fontFamily: "var(--font-mono)", color: "#888888", fontSize: "0.8rem" }}>
                  {deg.school}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
