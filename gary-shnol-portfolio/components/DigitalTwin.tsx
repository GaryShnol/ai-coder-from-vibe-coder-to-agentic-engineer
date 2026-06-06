"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string };
type ChatMsg = { type: "user" | "assistant" | "system" | "error"; text: string };

const INITIAL_MSGS: ChatMsg[] = [
  { type: "system", text: "Loading profile... [OK]" },
  { type: "system", text: "Injecting CV context... [OK]" },
  { type: "system", text: "Persona initialized... [OK]" },
  { type: "system", text: "You have 5 questions. Ask me anything about my experience, tech stack, or availability." },
];

function TypewriterMsg({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);

  // Keep ref in sync without triggering effect
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    doneRef.current = false;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        if (!doneRef.current) {
          doneRef.current = true;
          onDoneRef.current?.();
        }
      }
    }, 12);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <span className="font-mono text-sm whitespace-pre-wrap break-words" style={{ color: "rgba(232,237,242,0.85)", lineHeight: 1.65, fontSize: "0.875rem" }}>
      {displayed}
      {displayed.length < text.length && <span className="blink" style={{ color: "#ecad0a" }}>_</span>}
    </span>
  );
}

export default function DigitalTwin() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-60px" });

  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [msgs, setMsgs] = useState<ChatMsg[]>(INITIAL_MSGS);
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [remaining, setRemaining] = useState(5);
  const [loading, setLoading] = useState(false);
  const [activeTypewriter, setActiveTypewriter] = useState(false);

  const scrollBottom = useCallback(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollBottom();
  }, [msgs, scrollBottom]);

  const canSend = !loading && !activeTypewriter && remaining > 0 && input.trim().length > 0;

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || activeTypewriter || remaining <= 0) return;

    const userMsg: Message = { role: "user", content: text };
    const newHistory = [...history, userMsg];

    setMsgs((m) => [...m, { type: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsgs((m) => [...m, { type: "error", text: data.error ?? "Something went wrong." }]);
        if (res.status === 429) setRemaining(0);
      } else {
        const reply: string = data.reply ?? "";
        setHistory([...newHistory, { role: "assistant", content: reply }]);
        if (typeof data.remaining === "number") setRemaining(data.remaining);
        else setRemaining((r) => Math.max(0, r - 1));
        setActiveTypewriter(true);
        setMsgs((m) => [...m, { type: "assistant", text: reply }]);
      }
    } catch {
      setMsgs((m) => [...m, { type: "error", text: "Connection failed. Check your network." }]);
    } finally {
      setLoading(false);
    }
  }, [input, history, loading, activeTypewriter, remaining]);

  return (
    <section id="digital-twin" style={{ padding: "6rem 1.5rem", background: "#010e1f" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="sec-label">Digital Twin</span>
          <h2 style={{ fontWeight: 900, color: "#ffffff", fontSize: "clamp(2rem,5vw,3.5rem)", lineHeight: 1, marginBottom: "0.5rem" }}>
            SSH INTO<br />
            <span style={{ color: "#ecad0a", fontWeight: 300, fontStyle: "italic" }}>GARY</span>
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", color: "#888888", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "2.5rem" }}>
            AI-simulated interface &nbsp;&bull;&nbsp; {remaining > 0 ? `${remaining} questions` : "limit reached"}  per IP per day
          </p>
        </motion.div>

        {/* Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{ maxWidth: "48rem", border: "1px solid rgba(255,255,255,0.1)", background: "#010e1f" }}
        >
          {/* Chrome */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#021539" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <span style={{ width: "10px", height: "10px", background: "#ecad0a", display: "inline-block" }} />
                <span style={{ width: "10px", height: "10px", background: "rgba(255,255,255,0.12)", display: "inline-block" }} />
                <span style={{ width: "10px", height: "10px", background: "rgba(255,255,255,0.12)", display: "inline-block" }} />
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888888" }}>
                gary@digital-twin &mdash; ssh session
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="status-dot" style={{ width: "6px", height: "6px" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: remaining === 0 ? "#f87171" : "#888888" }}>
                {remaining === 0 ? "limit reached" : `${remaining} question${remaining !== 1 ? "s" : ""} left`}
              </span>
            </div>
          </div>

          {/* Login banner */}
          <div style={{ padding: "0.75rem 1.25rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#888888" }}>Last login: now from visitor-browser</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#888888" }}>Welcome to gary-shnol-v2.0 &nbsp;|&nbsp; Senior Backend &amp; AI Engineer</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#888888" }}>Type your question. Enter to send. Shift+Enter for newline.</p>
          </div>

          {/* Messages */}
          <div
            ref={messagesRef}
            className="chat-scroll"
            style={{ padding: "1rem 1.25rem", minHeight: "260px", maxHeight: "min(400px,50vh)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {msgs.map((msg, i) => {
              if (msg.type === "system") {
                return (
                  <p key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "rgba(232,237,242,0.65)", lineHeight: 1.5 }}>
                    {msg.text.includes("[OK]") ? (
                      <>
                        {msg.text.replace(" [OK]", "")}
                        {" "}
                        <span style={{ color: "#4ade80" }}>[OK]</span>
                      </>
                    ) : msg.text}
                  </p>
                );
              }
              if (msg.type === "user") {
                return (
                  <div key={i}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#209dd7", marginBottom: "0.25rem" }}>visitor@session:~$</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "rgba(32,157,215,0.9)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.65 }}>
                      {msg.text}
                    </p>
                  </div>
                );
              }
              if (msg.type === "assistant") {
                const isLast = i === msgs.length - 1 && activeTypewriter;
                return (
                  <div key={i}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#ecad0a", marginBottom: "0.25rem" }}>gary@digital-twin:~$</p>
                    {isLast ? (
                      <TypewriterMsg text={msg.text} onDone={() => setActiveTypewriter(false)} />
                    ) : (
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "rgba(232,237,242,0.85)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.65 }}>
                        {msg.text}
                      </p>
                    )}
                  </div>
                );
              }
              if (msg.type === "error") {
                return (
                  <p key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#f87171" }}>
                    &gt; Error: {msg.text}
                  </p>
                );
              }
              return null;
            })}
            {loading && (
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#ecad0a", marginBottom: "0.25rem" }}>gary@digital-twin:~$</p>
                <span className="blink" style={{ fontFamily: "var(--font-mono)", color: "#ecad0a", fontSize: "1rem" }}>_</span>
              </div>
            )}
          </div>

          {/* Input */}
          {remaining > 0 ? (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "0.75rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <label htmlFor="chat-input" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#209dd7", paddingTop: "0.45rem", flexShrink: 0 }}>
                <span className="hidden sm:inline">visitor@session:~$</span>
                <span className="sm:hidden">$</span>
              </label>
              <textarea
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={loading || activeTypewriter}
                placeholder="ask something..."
                maxLength={500}
                rows={1}
                style={{
                  flex: 1,
                  background: "transparent",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.875rem",
                  color: "#e8edf2",
                  caretColor: "#ecad0a",
                  resize: "none",
                  border: "none",
                  outline: "none",
                  minHeight: "36px",
                  paddingTop: "0.45rem",
                }}
              />
              <button
                onClick={send}
                disabled={!canSend}
                className="btn-yellow"
                style={{ padding: "0.45rem 1.1rem", fontSize: "0.6rem", flexShrink: 0 }}
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          ) : (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "0.75rem 1.25rem" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#888888" }}>
                &gt; Daily limit reached. Contact Gary directly:{" "}
                <a href="mailto:shnol.garik@gmail.com" className="hover-line" style={{ color: "#209dd7" }}>
                  shnol.garik@gmail.com
                </a>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
