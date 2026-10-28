"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/animation/prefs";
import { markReady } from "@/lib/animation/ready";
import { lockScroll } from "@/lib/animation/scroll";
import { loadCoaster, onCoasterProgress } from "@/lib/scenes/coasterModel";

/**
 * Covers the first paint and counts up while the coaster model streams in,
 * so the hero ride is ready the moment the curtain lifts. Then it signals the
 * page (markReady). Server-rendered so nothing flashes first; a CSS failsafe
 * hides it if the script never runs. A failed download lifts it anyway.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.dataset.preloader = "live"; // cancels the CSS failsafe: the script is running
    if (prefersReducedMotion()) {
      el.style.display = "none";
      markReady();
      return;
    }
    const unlock = lockScroll();
    const count = el.querySelector<HTMLElement>("[data-count]")!;
    const counter = { value: 0 };
    const setCount = () => { count.textContent = String(Math.round(counter.value)); };
    const follow = gsap.quickTo(counter, "value", { duration: 0.5, ease: "power1.out", onUpdate: setCount });
    const offProgress = onCoasterProgress(f => follow(Math.min(96, f * 100)));

    const tl = gsap.timeline();
    tl.from("[data-logo]", { scale: 0.6, rotate: -12, opacity: 0, duration: 1, ease: "back.out(1.8)" });

    let cancelled = false;
    const lift = () => {
      if (cancelled) return;
      offProgress();
      tl.to(counter, { value: 100, duration: 0.5, ease: "power2.out", onUpdate: setCount }, Math.max(tl.time(), 0.6))
        .to({}, { duration: 0.3 })
        .add(() => {
          unlock();
          window.scrollTo(0, 0);
          markReady();
        })
        .to("[data-logo], [data-count]", { y: -60, opacity: 0, duration: 0.6, ease: "power3.in", stagger: 0.05 })
        .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "expo.inOut" }, "<0.2")
        .set(el, { display: "none" });
    };
    loadCoaster().then(lift, lift);

    return () => {
      cancelled = true;
      offProgress();
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
      <span />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img data-logo src="/media/logo.png" alt="" className="mx-auto w-[min(40vw,180px)]" />
      <span data-count className="display self-end text-[clamp(4rem,14vw,11rem)] tabular-nums">0</span>
    </div>
  );
}
