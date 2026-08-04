"use client";

import { useEffect, useState } from "react";
import { FAQ_ENTRIES } from "@/lib/faq-content";
import { MANUAL_PAYMENT_INFO } from "@/lib/site-config";

const SEEN_KEY = "arcana-faq-bot-seen";

type Message = { from: "bot" | "user"; text: string };

const SPARKLE_POSITIONS = [
  { top: "-6px", left: "8px", delay: "0s", color: "#00fff2" },
  { top: "4px", left: "-8px", delay: "0.4s", color: "#ff2bd6" },
  { top: "-8px", right: "6px", delay: "0.9s", color: "#b026ff" },
  { bottom: "-6px", right: "-6px", delay: "1.3s", color: "#00fff2" },
] as const;

/**
 * Sitewide FAQ helper — a floating launcher that opens a scripted Q&A
 * transcript. Deterministic on purpose (see lib/faq-content.ts): a closed
 * set of "what is this" questions doesn't need an AI backend to answer
 * well, so this never makes a network call or costs anything to run.
 */
export function FaqChatWidget() {
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: "¡Hola! Soy el asistente de Arcana Realm Studios. Elegí una pregunta de abajo 👇",
    },
  ]);
  const [answered, setAnswered] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY)) return;
    const showTimer = setTimeout(() => setShowNudge(true), 1500);
    const hideTimer = setTimeout(() => setShowNudge(false), 9000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  function handleOpen() {
    setOpen(true);
    setShowNudge(false);
    localStorage.setItem(SEEN_KEY, "1");
  }

  function askQuestion(question: string, answer: string) {
    setMessages((prev) => [...prev, { from: "user", text: question }, { from: "bot", text: answer }]);
    setAnswered((prev) => new Set(prev).add(question));
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex max-h-[70vh] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-arcana-cyan/40 bg-arcana-surface/95 shadow-neon-cyan-sm backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-arcana-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-neon-pulse rounded-full bg-arcana-cyan shadow-neon-cyan-sm" />
              <span className="font-display text-sm font-bold uppercase tracking-wide text-arcana-cyan">
                Arcana Bot
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="rounded-md px-2 py-1 text-arcana-textMuted transition-colors hover:text-arcana-text"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm " +
                  (message.from === "bot"
                    ? "border border-arcana-cyan/30 bg-arcana-bg text-arcana-text"
                    : "ml-auto border border-arcana-pink/30 bg-arcana-pink/10 text-arcana-text")
                }
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-arcana-border px-4 py-3">
            {FAQ_ENTRIES.filter((entry) => !answered.has(entry.question)).map((entry) => (
              <button
                key={entry.question}
                type="button"
                onClick={() => askQuestion(entry.question, entry.answer)}
                className="rounded-full border border-arcana-cyan/40 px-3 py-1.5 text-xs text-arcana-text transition-all hover:border-arcana-cyan hover:shadow-neon-cyan-sm"
              >
                {entry.question}
              </button>
            ))}
            {answered.size === FAQ_ENTRIES.length && (
              <p className="w-full text-center text-xs text-arcana-textMuted">
                Esas son todas mis respuestas por ahora ✨
              </p>
            )}
          </div>

          <p className="holo-border rounded-b-xl border-t border-arcana-border px-4 py-2.5 text-center text-xs text-arcana-textMuted">
            ✨ Seguinos en IMVU:{" "}
            <span className="font-semibold text-arcana-pink">{MANUAL_PAYMENT_INFO.imvuUsername}</span> ✨
          </p>
        </div>
      )}

      {!open && showNudge && (
        <div className="holo-border animate-neon-pulse rounded-lg border border-arcana-cyan/50 px-3 py-2 text-xs text-arcana-text shadow-neon-cyan-sm">
          ¿Necesitás ayuda? 💬
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        aria-label="Abrir asistente de preguntas frecuentes"
        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-arcana-cyan/60 bg-arcana-surface text-2xl text-arcana-cyan shadow-neon-cyan transition-transform hover:scale-105"
      >
        {!open &&
          SPARKLE_POSITIONS.map((pos, index) => (
            <span
              key={index}
              className="sparkle-dot"
              style={{
                top: "top" in pos ? pos.top : undefined,
                bottom: "bottom" in pos ? pos.bottom : undefined,
                left: "left" in pos ? pos.left : undefined,
                right: "right" in pos ? pos.right : undefined,
                color: pos.color,
                animationDelay: pos.delay,
              }}
            />
          ))}
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
