"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  { src: "/marketing/flyer-square-full.png", alt: "Arcana Realm Studios — live radio bot for IMVU, always connected" },
  { src: "/marketing/flyer-square-minimal.png", alt: "Arcana Realm Studios — 24/7 live radio, YouTube to MP3, made for IMVU" },
];

const INTERVAL_MS = 6000;
const GLITCH_MS = 250;

const CORNER_CLASS = "hero-corner border-arcana-cyan drop-shadow-[0_0_6px_rgba(0,255,242,0.8)]";
const CORNER_CLASS_ALT = "hero-corner border-arcana-pink drop-shadow-[0_0_6px_rgba(255,43,214,0.8)]";

/**
 * Crossfades between the marketing flyers with a CRT/HUD frame (scanline
 * texture, a sweeping scan line, corner brackets) and a brief glitch-slice
 * right at each cut. Freezes on the first slide, no glitch, no sweep under
 * prefers-reduced-motion — matches the pattern GlitchText already uses.
 */
export function HeroFlyerCarousel() {
  const [index, setIndex] = useState(0);
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const id = setInterval(() => {
      setGlitching(true);
      setIndex((prev) => (prev + 1) % SLIDES.length);
      setTimeout(() => setGlitching(false), GLITCH_MS);
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`hero-frame animate-hero-breathe relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-arcana-border sm:max-w-md ${glitching ? "hero-glitching" : ""}`}
    >
      {SLIDES.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="(min-width: 640px) 28rem, 90vw"
          className={`object-cover transition-opacity duration-1000 ease-in-out ${i === index ? "opacity-100" : "opacity-0"}`}
        />
      ))}

      <div aria-hidden className="hero-scan-sweep" />

      <span aria-hidden className={`${CORNER_CLASS} left-0 top-0 border-l-2 border-t-2`} />
      <span aria-hidden className={`${CORNER_CLASS_ALT} right-0 top-0 border-r-2 border-t-2`} />
      <span aria-hidden className={`${CORNER_CLASS_ALT} bottom-0 left-0 border-b-2 border-l-2`} />
      <span aria-hidden className={`${CORNER_CLASS} bottom-0 right-0 border-b-2 border-r-2`} />
    </div>
  );
}
