"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * A soft follower for mouse users. Shrinks over links and shows a label
 * over anything marked data-cursor="Label".
 */
export default function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const circle = dot.current;
    const text = label.current;
    if (!el || !circle || !text || !window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.setAttribute("data-cursor", "");
    const x = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
    let current = "";
    const onMove = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
      el.style.opacity = "1";
      const target = e.target as HTMLElement | null;
      const tag = target?.closest?.<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "";
      const link = !!target?.closest?.("a, button");
      const state = tag ? `label:${tag}` : link ? "link" : "";
      if (state === current) return;
      current = state;
      text.textContent = tag;
      gsap.to(circle, { width: tag ? 96 : link ? 14 : 44, height: tag ? 96 : link ? 14 : 44, duration: 0.4, ease: "power3.out" });
      gsap.to(text, { opacity: tag ? 1 : 0, scale: tag ? 1 : 0.6, duration: 0.3 });
    };
    const onLeave = () => { el.style.opacity = "0"; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.documentElement.removeAttribute("data-cursor");
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={root} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[300] opacity-0 mix-blend-difference">
      <div ref={dot} className="grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white">
        <span ref={label} className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-black opacity-0" />
      </div>
    </div>
  );
}
