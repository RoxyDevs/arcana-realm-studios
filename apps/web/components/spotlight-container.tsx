"use client";

import type { MouseEvent, ReactNode } from "react";

/** Wraps children in a cyan glow that follows the cursor — purely decorative, ignored by prefers-reduced-motion via its own hover-only opacity. */
export function SpotlightContainer({ children }: { children: ReactNode }) {
  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty("--spot-x", `${x}%`);
    e.currentTarget.style.setProperty("--spot-y", `${y}%`);
  }

  return (
    <div onMouseMove={handleMouseMove} className="group relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(520px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(0,255,242,0.16), transparent 45%)",
        }}
      />
      {children}
    </div>
  );
}
