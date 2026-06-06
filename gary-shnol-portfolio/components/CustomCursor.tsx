"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [active, setActive] = useState(false);
  const [hovering, setHovering] = useState(false);

  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);
  const springX = useSpring(rawX, { stiffness: 200, damping: 28, mass: 0.5 });
  const springY = useSpring(rawY, { stiffness: 200, damping: 28, mass: 0.5 });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;

    const activateId = setTimeout(() => setActive(true), 0);

    const move = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };

    const enter = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [role='button']")) setHovering(true);
    };

    const leave = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [role='button']")) setHovering(false);
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
          pointerEvents: "none",
          zIndex: 9998,
          transition: "width 0.2s ease, height 0.2s ease",
        }}
      />
    </>
  );
}
