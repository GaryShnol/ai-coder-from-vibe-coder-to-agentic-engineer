"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const OPEN_PALETTE_EVENT = "open-command-palette";

const CONTACT_EMAIL = "shnol.garik@gmail.com";

type Action =
  | { kind: "nav"; href: string }
  | { kind: "link"; href: string; external?: boolean }
  | { kind: "print"; lines: string[] };

type Command = {
  id: string;
  label: string;
  hint: string;
  keywords: string[];
  action: Action;
};

function buildHireMailto(): string {
  const params = new URLSearchParams({
    subject: "Let's talk",
    body: "Hi Gary,\n\nI found your portfolio (and your command palette) — could we grab 15 minutes to talk?\n",
  });
  return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
}

const COMMANDS: Command[] = [
  { id: "nav-top", label: "cd ~/", hint: "back to the top", keywords: ["home", "top", "hero"], action: { kind: "nav", href: "#top" } },
  { id: "nav-experience", label: "cd ./experience", hint: "career timeline", keywords: ["work", "job", "career", "amdocs"], action: { kind: "nav", href: "#experience" } },
  { id: "nav-skills", label: "cd ./skills", hint: "tech stack & system status", keywords: ["stack", "tech", "tools"], action: { kind: "nav", href: "#skills" } },
  { id: "nav-education", label: "cd ./education", hint: "degrees & certifications", keywords: ["degree", "school", "university", "msc"], action: { kind: "nav", href: "#education" } },
  { id: "nav-marketing", label: "run ./pitch-generator", hint: "60-second AI pitch, tailored to you", keywords: ["marketing", "pitch", "60 seconds", "ai", "agent"], action: { kind: "nav", href: "#marketing" } },
  { id: "nav-twin", label: "ssh gary@digital-twin", hint: "chat with the AI digital twin", keywords: ["chat", "ai", "twin", "talk", "ask"], action: { kind: "nav", href: "#digital-twin" } },
  { id: "nav-contact", label: "cd ./contact", hint: "get in touch", keywords: ["email", "reach", "contact", "linkedin"], action: { kind: "nav", href: "#contact" } },
  {
    id: "whoami",
    label: "whoami",
    hint: "print identity",
    keywords: ["who", "identity", "about", "bio"],
    action: {
      kind: "print",
      lines: [
        "gary_gavriel_shnol",
        "> senior backend & ai engineer · 5+ yrs @ amdocs",
        "> java · kafka · postgresql · fastapi · langgraph",
        "> m.sc. software engineering",
        "> currently building: multi-agent systems",
      ],
    },
  },
  { id: "sudo-hire", label: "sudo hire-gary", hint: "compose an email — let's talk", keywords: ["hire", "email", "sudo", "recruit"], action: { kind: "link", href: buildHireMailto() } },
  { id: "linkedin", label: "open linkedin", hint: "view profile on linkedin", keywords: ["linkedin", "social", "profile"], action: { kind: "link", href: "https://www.linkedin.com/in/gary-gavriel-shnol", external: true } },
  {
    id: "ssh-root",
    label: "ssh root@portfolio",
    hint: "???",
    keywords: ["root", "hack", "sudo", "permission"],
    action: { kind: "print", lines: ["Permission denied (publickey).", "> nice try — \"sudo hire-gary\" works better_"] },
  },
  { id: "exit", label: "exit", hint: "close this palette", keywords: ["quit", "close", "esc"], action: { kind: "print", lines: [] } },
];

function matches(query: string, cmd: Command): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    cmd.label.toLowerCase().includes(q) ||
    cmd.hint.toLowerCase().includes(q) ||
    cmd.keywords.some((k) => k.includes(q))
  );
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [log, setLog] = useState<{ cmd: string; lines: string[] }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => COMMANDS.filter((c) => matches(query, c)), [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setSelected(0);
    setLog([]);
  };

  // Global shortcut: Cmd/Ctrl+K toggles, Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onCustomOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onCustomOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setLog([]);
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [log]);

  const run = (cmd: Command) => {
    const action = cmd.action;
    switch (action.kind) {
      case "nav": {
        close();
        const target = document.querySelector(action.href);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      case "link": {
        close();
        if (action.external) window.open(action.href, "_blank", "noopener,noreferrer");
        else window.location.href = action.href;
        return;
      }
      case "print": {
        if (cmd.id === "exit") {
          close();
          return;
        }
        setLog((l) => [...l, { cmd: cmd.label, lines: action.lines }]);
        setQuery("");
        setSelected(0);
        inputRef.current?.focus();
        return;
      }
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[selected];
      if (cmd) run(cmd);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 8000,
            background: "rgba(1,14,31,0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "12vh 1.25rem 2rem",
          }}
        >
          <motion.div
            key="palette"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            style={{
              width: "100%",
              maxWidth: "34rem",
              background: "#021539",
              border: "1px solid rgba(236,173,10,0.25)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {/* Prompt input */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ color: "#ecad0a", fontSize: "0.8rem", flexShrink: 0 }}>gary@portfolio:~$</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="type a command or search…"
                aria-label="Command input"
                spellCheck={false}
                autoComplete="off"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#e8edf2",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  caretColor: "#ecad0a",
                }}
              />
              <span style={{ fontSize: "0.6rem", color: "#888888", letterSpacing: "0.1em", flexShrink: 0 }}>ESC</span>
            </div>

            {/* REPL output log */}
            {log.length > 0 && (
              <div className="chat-scroll" style={{ maxHeight: "12rem", overflowY: "auto", padding: "0.75rem 1.25rem 0", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {log.map((entry, i) => (
                  <div key={i} style={{ fontSize: "0.7rem", lineHeight: 1.8 }}>
                    <p style={{ color: "#888888" }}>
                      <span style={{ color: "#ecad0a" }}>$</span> {entry.cmd}
                    </p>
                    {entry.lines.map((line, j) => (
                      <p key={j} style={{ color: j === 0 ? "#e8edf2" : "rgba(232,237,242,0.6)", paddingLeft: "0.9rem", whiteSpace: "pre-wrap" }}>
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            )}

            {/* Filtered command list */}
            <div style={{ maxHeight: "18rem", overflowY: "auto", padding: "0.5rem" }} className="chat-scroll">
              {filtered.length === 0 ? (
                <p style={{ padding: "1rem", fontSize: "0.7rem", color: "#888888" }}>
                  command not found: <span style={{ color: "#f87171" }}>{query}</span>
                </p>
              ) : (
                filtered.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    onClick={() => run(cmd)}
                    onMouseEnter={() => setSelected(i)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      textAlign: "left",
                      padding: "0.6rem 0.75rem",
                      background: i === selected ? "rgba(236,173,10,0.1)" : "transparent",
                      border: "none",
                      borderLeft: i === selected ? "2px solid #ecad0a" : "2px solid transparent",
                      cursor: "pointer",
                      transition: "background 0.12s ease",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: i === selected ? "#ecad0a" : "#e8edf2" }}>{cmd.label}</span>
                    <span style={{ fontSize: "0.65rem", color: "#888888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cmd.hint}</span>
                  </button>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div style={{ display: "flex", gap: "1.25rem", padding: "0.6rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "0.6rem", color: "#888888", letterSpacing: "0.05em" }}>
              <span><kbd style={{ color: "#ecad0a" }}>↑↓</kbd> navigate</span>
              <span><kbd style={{ color: "#ecad0a" }}>↵</kbd> run</span>
              <span><kbd style={{ color: "#ecad0a" }}>esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
