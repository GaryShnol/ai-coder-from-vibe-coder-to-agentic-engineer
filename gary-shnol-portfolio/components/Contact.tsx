"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const CONTACTS = [
  { label: "Email", href: "mailto:shnol.garik@gmail.com", display: "shnol.garik@gmail.com" },
  { label: "Phone", href: "tel:+972548359181", display: "+972-54-8359181" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/gary-gavriel-shnol", display: "gary-gavriel-shnol", external: true },
];

export default function Contact() {
  const headRef = useRef<HTMLDivElement>(null);
  const headInView = useInView(headRef, { once: true, margin: "-60px" });

  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: "-60px" });

  return (
    <section id="contact" style={{ padding: "6rem 1.5rem", background: "#021539" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        {/* Available bar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={headInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem", marginBottom: "2.5rem", border: "1px solid rgba(236,173,10,0.3)", padding: "0.75rem 1.5rem", width: "fit-content" }}
        >
          <span className="status-dot" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#ecad0a", fontWeight: 700 }}>
            Available for Hire
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#888888" }} className="hidden sm:inline">
            &mdash; Senior Backend &amp; AI Engineering Roles
          </span>
        </motion.div>

        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="sec-label">Contact</span>
          <h2 style={{ fontWeight: 900, color: "#ffffff", fontSize: "clamp(2rem,5vw,3.5rem)", lineHeight: 1, marginBottom: "0.75rem" }}>
            LET&rsquo;S<br />
            <span style={{ color: "#ecad0a", fontWeight: 300, fontStyle: "italic" }}>TALK</span>
          </h2>
          <p style={{ color: "rgba(232,237,242,0.45)", fontSize: "0.875rem", maxWidth: "28rem", lineHeight: 1.7, fontWeight: 300, marginBottom: "3rem" }}>
            Open to senior backend roles, AI engineering positions, and interesting technical challenges.
            Not interested in recruiters who haven&apos;t read this page.
          </p>
        </motion.div>

        <div
          ref={gridRef}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", background: "rgba(255,255,255,0.04)", marginBottom: "3rem" }}
        >
          {CONTACTS.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 20 }}
              animate={gridInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{ padding: "1.5rem", background: "#021539" }}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888888", marginBottom: "0.75rem" }}>
                &gt; {c.label}
              </p>
              <a
                href={c.href}
                className="contact-link"
                {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {c.display}
              </a>
            </motion.div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }} className="sm:flex-row sm:justify-between sm:items-center">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#888888", letterSpacing: "0.1em" }}>
            Gary Gavriel Shnol &copy; 2026
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#888888" }}>
            Available for remote &amp; hybrid
          </p>
        </div>
      </div>
    </section>
  );
}
