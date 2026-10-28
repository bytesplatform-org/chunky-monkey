"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/animation/prefs";
import { markReady } from "@/lib/animation/ready";
import { lockScroll } from "@/lib/animation/scroll";

/**
 * Covers the first paint, counts to 100 while the bulbs come on, then lifts
 * like a curtain and signals the page (markReady) so the hero intro plays in
 * view. Server-rendered so nothing flashes first; a CSS failsafe hides it if
 * the script never runs.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.display = "none";
      markReady();
      return;
    }
    const unlock = lockScroll();
    const count = el.querySelector<HTMLElement>("[data-count]")!;
    const bulbs = el.querySelectorAll<HTMLElement>("[data-bulb]");
    const counter = { value: 0 };
    const tl = gsap.timeline();
    tl.from("[data-logo]", { scale: 0.6, rotate: -12, opacity: 0, duration: 1, ease: "back.out(1.8)" }, 0)
      .to(counter, {
        value: 100,
        duration: 1.9,
        ease: "power2.inOut",
        onUpdate: () => {
          const v = Math.round(counter.value);
          count.textContent = String(v);
          bulbs.forEach((b, i) => b.toggleAttribute("data-on", v >= ((i + 1) / bulbs.length) * 100));
        },
      }, 0)
      .add(() => {
        unlock();
        window.scrollTo(0, 0);
        markReady();
      })
      .to("[data-logo]", { y: -60, scale: 1.15, opacity: 0, duration: 0.7, ease: "power3.in" }, ">-0.1")
      .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "expo.inOut" }, "<0.2")
      .set(el, { display: "none" });
    return () => {
      tl.kill();
      unlock();
    };
  }, []);

  return (
    <div
      ref={root}
      data-preloader
      className="fixed inset-0 z-[200] flex flex-col justify-between bg-night p-(--gut) text-cream"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
    >
      <div className="eyebrow flex justify-between text-cream/60">
        <span>Karachi · Hyderabad</span>
        <span>4 PM – 12 AM</span>
      </div>
      <div className="flex flex-col items-center gap-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-logo src="/media/logo.png" alt="" className="w-[min(40vw,180px)] drop-shadow-[0_0_30px_rgba(255,201,60,0.35)]" />
        <div className="flex gap-2.5" aria-hidden>
          {["bg-red", "bg-yellow", "bg-green", "bg-blue", "bg-pink", "bg-orange", "bg-yellow", "bg-red"].map((c, i) => (
            <span key={i} data-bulb className={`size-2.5 rounded-full ${c} opacity-20 transition-[opacity,box-shadow] duration-300 data-on:opacity-100 data-on:shadow-[0_0_14px_currentColor]`} />
          ))}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="eyebrow text-cream/60">Fun for all</span>
        <span data-count className="display text-[clamp(4rem,14vw,11rem)] tabular-nums text-yellow">0</span>
      </div>
    </div>
  );
}
