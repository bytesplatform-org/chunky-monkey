"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/animation/prefs";

gsap.registerPlugin(ScrollTrigger);

/** Counts up to `to` when it scrolls into view. Renders the final number on the server. */
export default function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const value = { n: 0 };
    el.textContent = "0";
    const tween = gsap.to(value, {
      n: to,
      duration: 1.8,
      ease: "power3.out",
      onUpdate: () => { el.textContent = String(Math.round(value.n)); },
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      el.textContent = String(to);
    };
  }, [to]);

  return <span ref={ref} className="tabular-nums">{to}</span>;
}
