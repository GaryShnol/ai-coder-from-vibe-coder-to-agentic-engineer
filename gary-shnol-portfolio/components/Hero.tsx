"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

// ---- Particle Canvas ----
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    type P = { x: number; y: number; vx: number; vy: number; r: number; color: string };
    const count = window.innerWidth < 768 ? 40 : 70;
    const particles: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.5,
      color: Math.random() > 0.45 ? "rgba(236,173,10,0.65)" : "rgba(32,157,215,0.5)",
    }));

    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        else if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        else if (p.y > canvas.height) p.y = 0;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(236,173,10,${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.45,
        pointerEvents: "none",
      }}
    />
  );
}

// ---- Typing Effect ----
const PHRASES = [
  "Senior Backend & AI Engineer",
  "Enterprise Systems Architect",
  "Multi-Agent Systems Builder",
  "Generative AI Engineer",
];

function TypingSubtitle() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = PHRASES[phraseIdx];
    if (!deleting) {
      if (displayed.length < current.length) {
        const t = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 55);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setDeleting(true), 2200);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 28);
        return () => clearTimeout(t);
      } else {
        setDeleting(false);
        setPhraseIdx((i) => (i + 1) % PHRASES.length);
      }
    }
  }, [displayed, deleting, phraseIdx]);

  return (
    <span style={{ fontFamily: "var(--font-mono)", color: "#209dd7", fontSize: "clamp(0.9rem,2.2vw,1.2rem)" }}>
      {displayed}
      <span className="blink" style={{ color: "#ecad0a" }}>_</span>
    </span>
  );
}

// ---- Animated Counter ----
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || animated.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animated.current) return;
        animated.current = true;
        const start = performance.now();
        const dur = 1400;
        const tick = (now: number) => {
          const t = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setVal(Math.round(ease * target));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {val}{suffix}
    </span>
  );
}

// ---- Magnetic Button ----
function MagneticButton({
  href,
  className,
  children,
  target,
  rel,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 22;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 10;
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.style.transition = "transform 0.1s ease";
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0,0)";
    el.style.transition = "transform 0.35s cubic-bezier(0.23,1,0.32,1)";
  }, []);

  return (
    <a
      ref={ref}
      href={href}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      target={target}
      rel={rel}
    >
      {children}
    </a>
  );
}

// ---- Name letters stagger ----
const nameLines = [
  { text: "GARY", color: "#ffffff" },
  { text: "GAVRIEL", color: "#ecad0a", glitch: true },
  { text: "SHNOL", color: "#ffffff" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } },
};

const letterVar = {
  hidden: { y: 80, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

// ---- Hero ----
export default function Hero() {
  return (
    <section
      id="top"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "7rem 1.5rem 4rem",
        overflow: "hidden",
      }}
      className="scanlines"
    >
      {/* Background layers */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* Dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(236,173,10,0.1) 1px, transparent 0)",
            backgroundSize: "40px 40px",
            opacity: 0.5,
          }}
        />
        {/* Glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 75% -5%, rgba(32,157,215,0.1) 0%, transparent 55%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 110%, rgba(236,173,10,0.05) 0%, transparent 45%)" }} />
      </div>

      <ParticleCanvas />

      <div style={{ position: "relative", zIndex: 10, maxWidth: "72rem", margin: "0 auto", width: "100%" }}>
        {/* Available badge */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}
        >
          <span className="status-dot" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#ecad0a" }}>
            Available for hire
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#888888" }} className="hidden sm:inline">
            &mdash; Senior Backend &amp; AI roles
          </span>
        </motion.div>

        {/* Name */}
        <div
          style={{
            fontSize: "clamp(3.5rem,10vw,8rem)",
            lineHeight: 0.92,
            fontWeight: 900,
            letterSpacing: "-0.01em",
            marginBottom: "1.75rem",
            overflow: "hidden",
          }}
        >
          {nameLines.map((line, li) => (
            <div key={li} style={{ overflow: "hidden" }}>
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                style={{ display: "flex", flexWrap: "wrap" }}
              >
                {line.text.split("").map((ch, ci) => (
                  <motion.span
                    key={ci}
                    variants={letterVar}
                    style={{ color: line.color, display: "inline-block" }}
                    className={line.glitch && ci === 0 ? "glitch" : undefined}
                  >
                    {ch}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "left", display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}
        >
          <div style={{ width: "3rem", height: "2px", background: "#ecad0a" }} />
          <div style={{ width: "1rem", height: "2px", background: "rgba(236,173,10,0.3)" }} />
        </motion.div>

        {/* Typing subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.4 }}
          style={{ marginBottom: "0.5rem" }}
        >
          <TypingSubtitle />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
          style={{ fontFamily: "var(--font-mono)", color: "#888888", fontSize: "0.8rem", marginBottom: "0.75rem", letterSpacing: "0.05em" }}
        >
          M.Sc. Software Engineering &nbsp;&bull;&nbsp; Amdocs
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          style={{ color: "rgba(232,237,242,0.55)", fontSize: "0.9rem", maxWidth: "30rem", lineHeight: 1.7, fontWeight: 300, marginBottom: "2.5rem" }}
        >
          I build backend systems that process millions of events without breaking a sweat.
          Currently shipping AI that actually works.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "4rem" }}
        >
          <MagneticButton href="#digital-twin" className="btn-yellow">
            Talk to my Digital Twin
          </MagneticButton>
          <MagneticButton
            href="https://www.linkedin.com/in/gary-gavriel-shnol"
            className="btn-ghost"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </MagneticButton>
          <MagneticButton href="#contact" className="btn-ghost">
            Contact
          </MagneticButton>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.45, duration: 0.5 }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "2.5rem",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: "2.5rem",
          }}
        >
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#ecad0a", fontSize: "2rem" }}>
              <Counter target={5} suffix="+" />
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888888" }}>
              Years at Amdocs
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#ecad0a", fontSize: "2rem" }}>
              M.Sc.
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888888" }}>
              Software Engineering
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#ecad0a", fontSize: "2rem" }}>
              <Counter target={23} suffix="%" />
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888888" }}>
              ML Accuracy Gain
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#ecad0a", fontSize: "2rem" }}>
              <Counter target={9} />
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888888" }}>
              Integrations shipped
            </p>
          </div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <a
        href="#experience"
        className="hover-line"
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#888888",
          textDecoration: "none",
          zIndex: 10,
        }}
      >
        Scroll &darr;
      </a>
    </section>
  );
}
