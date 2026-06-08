"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const MAGNETIC_SELECTOR = "a, button, [role='button']";
// How strongly the cursor is pulled toward a hovered element's center —
// 0 = follows the raw pointer exactly, 1 = locks dead-center.
const MAGNET_PULL = 0.35;

export default function CustomCursor() {
  const [active, setActive] = useState(false);
  const [hovering, setHovering] = useState(false);
  const magnetRect = useRef<DOMRect | null>(null);

  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);
  const springX = useSpring(rawX, { stiffness: 200, damping: 28, mass: 0.5 });
  const springY = useSpring(rawY, { stiffness: 200, damping: 28, mass: 0.5 });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;

    const activateId = setTimeout(() => setActive(true), 0);

    const move = (e: MouseEvent) => {
      const rect = magnetRect.current;
      if (rect) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        rawX.set(cx + (e.clientX - cx) * (1 - MAGNET_PULL));
        rawY.set(cy + (e.clientY - cy) * (1 - MAGNET_PULL));
      } else {
        rawX.set(e.clientX);
        rawY.set(e.clientY);
      }
    };

    const enter = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const target = t.closest<HTMLElement>(MAGNETIC_SELECTOR);
      if (target) {
        magnetRect.current = target.getBoundingClientRect();
        setHovering(true);
      }
    };

    const leave = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest(MAGNETIC_SELECTOR)) {
        magnetRect.current = null;
        setHovering(false);
      }
    };

    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseover", enter);
    document.addEventListener("mouseout", leave);

    return () => {
      clearTimeout(activateId);
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", enter);
      document.removeEventListener("mouseout", leave);
    };
  }, [rawX, rawY]);

  if (!active) return null;

  return (
    <>
      {/* Dot — follows exactly */}
      <motion.div
        style={{
          x: rawX,
          y: rawY,
          transform: "translate(-50%, -50%)",
          position: "fixed",
          top: 0,
          left: 0,
          width: hovering ? "10px" : "6px",
          height: hovering ? "10px" : "6px",
          backgroundColor: "#ecad0a",
          pointerEvents: "none",
          zIndex: 9999,
          transition: "width 0.15s ease, height 0.15s ease",
        }}
      />
      {/* Ring — follows with spring */}
      <motion.div
        style={{
          x: springX,
          y: springY,
          transform: "translate(-50%, -50%)",
          position: "fixed",
          top: 0,
          left: 0,
          width: hovering ? "44px" : "32px",
          height: hovering ? "44px" : "32px",
          border: "1px solid rgba(236,173,10,0.45)",
          borderRadius: "50%",
          boxShadow: hovering ? "0 0 24px rgba(236,173,10,0.25)" : "none",
          pointerEvents: "none",
          zIndex: 9998,
          transition: "width 0.2s ease, height 0.2s ease, box-shadow 0.25s ease",
        }}
      />
    </>
  );
}
