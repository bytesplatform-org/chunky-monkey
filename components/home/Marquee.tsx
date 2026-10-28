"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/animation/prefs";

gsap.registerPlugin(ScrollTrigger);

/** A tape of words that drifts on its own, speeds up and flips with scroll, and skews with the speed. */
export default function Marquee({ items, className = "", speed = 60 }: { items: string[]; className?: string; speed?: number }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el || prefersReducedMotion()) return;
    let x = 0;
    let direction = -1;
    let boost = 0;
    const skew = gsap.quickTo(el, "skewX", { duration: 0.4, ease: "power3.out" });
    const trigger = ScrollTrigger.create({
      onUpdate: self => {
        const v = self.getVelocity();
        direction = v < 0 ? 1 : -1;
        boost = Math.min(Math.abs(v) / 300, 8);
        skew(gsap.utils.clamp(-12, 12, v / -200));
      },
    });
    const tick = (_t: number, dt: number) => {
      const half = el.scrollWidth / 2;
      x += direction * speed * (1 + boost) * (dt / 1000);
      boost *= 0.94;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      gsap.set(el, { x });
      if (boost < 0.05) skew(0);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      trigger.kill();
    };
  }, [speed]);

  const row = items.map((item, i) => (
    <span key={i} className="flex items-center gap-[0.4em] pr-[0.4em]">
      <span>{item}</span>
      <span aria-hidden className="text-cream/30">/</span>
    </span>
  ));

  return (
    <div className={`overflow-hidden ${className}`} aria-label={items.join(", ")}>
      <div ref={track} aria-hidden className="display flex w-max whitespace-nowrap will-change-transform">
        {row}
        {row}
      </div>
    </div>
  );
}
