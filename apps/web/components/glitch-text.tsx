"use client";

import { useEffect, useState } from "react";

const GLYPHS = "!<>-_\\/[]{}=+*^?#01";

/** Reveals `text` left-to-right through a brief random-character scramble, like a terminal decoding a string. */
export function GlitchText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    const totalFrames = text.length * 3;

    const id = setInterval(() => {
      frame += 1;
      const revealCount = Math.floor((frame / totalFrames) * text.length);

      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            return i < revealCount ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join(""),
      );

      if (frame >= totalFrames) {
        clearInterval(id);
        setDisplay(text);
      }
    }, 40);

    return () => clearInterval(id);
  }, [text]);

  return <span className={className}>{display}</span>;
}
