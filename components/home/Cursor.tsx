"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/** For mouse users, a small label beside the pointer over anything marked data-cursor="Label". */
export default function Cursor() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const x = gsap.quickTo(el, "x", { duration: 0.25, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.25, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      x(e.clientX + 16);
      y(e.clientY + 16);
      const label = (e.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-cursor]")?.dataset.cursor;
      if (label) el.textContent = label;
      el.style.opacity = label ? "1" : "0";
    };
    const onLeave = () => { el.style.opacity = "0"; };
    window.addEventListener("pointermove", onMove, { passive: true });
    // the page moves out from under a still pointer: nothing says what's beneath it until it moves
    window.addEventListener("scroll", onLeave, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[300] rounded-full bg-night px-3 py-1 text-sm font-semibold text-cream opacity-0 transition-opacity duration-150"
    />
  );
}
