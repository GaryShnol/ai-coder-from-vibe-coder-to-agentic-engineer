"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OPEN_PALETTE_EVENT } from "@/components/CommandPalette";

const NAV_ITEMS = [
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
  { href: "#education", label: "Education" },
  { href: "#marketing", label: "60 Seconds ⚡" },
  { href: "#digital-twin", label: "Digital Twin" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: scrolled ? "rgba(1,14,31,0.92)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
      }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ height: "3.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <a href="#top" className="hover-line" style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#ecad0a", fontSize: "0.875rem", letterSpacing: "0.2em", textDecoration: "none" }}>
            GS_
          </a>

          {/* Desktop nav */}
          <ul style={{ display: "flex", alignItems: "center", gap: "2rem", listStyle: "none", margin: 0, padding: 0 }} className="hidden md:flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="nav-link">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Available badge */}
          <div className="hidden md:flex" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
              aria-label="Open command palette"
              title="Open command palette"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#888888",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "0.3rem 0.6rem",
                cursor: "pointer",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(236,173,10,0.5)";
                e.currentTarget.style.color = "#ecad0a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#888888";
              }}
            >
              <span>⌘</span>
              <span>K</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="status-dot" />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#ecad0a" }}>
                Available
              </span>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888888", background: "none", border: "none", padding: 0 }}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden", background: "#010e1f", borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <ul style={{ listStyle: "none", margin: 0, padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="nav-link" onClick={closeMenu}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
