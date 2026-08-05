"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  { src: "/marketing/flyer-square-full.png", alt: "Arcana Realm Studios — live radio bot for IMVU, always connected" },
  { src: "/marketing/flyer-square-minimal.png", alt: "Arcana Realm Studios — 24/7 live radio, YouTube to MP3, made for IMVU" },
];

const INTERVAL_MS = 6000;

/** Crossfades between the marketing flyers — freezes on the first slide under prefers-reduced-motion. */
export function HeroFlyerCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="animate-hero-breathe relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-arcana-border shadow-neon-cyan-sm sm:max-w-md">
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
    </div>
  );
}
