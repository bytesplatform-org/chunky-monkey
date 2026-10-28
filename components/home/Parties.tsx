"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/data/site";
import { prefersReducedMotion } from "@/lib/animation/prefs";
import PillLink from "./PillLink";

gsap.registerPlugin(ScrollTrigger);

const OCCASIONS = ["Birthdays", "School trips", "Family get-togethers", "Corporate nights"];

/** Balloons and confetti, each drifting at its own depth as the section scrolls by. */
const FLOATERS = [
  { kind: "balloon", color: "#fff6e5", x: "8%", y: "12%", size: 90, depth: 1.4 },
  { kind: "balloon", color: "#fff6e5", x: "82%", y: "8%", size: 120, depth: 2 },
  { kind: "balloon", color: "#fff6e5", x: "70%", y: "62%", size: 80, depth: 1.1 },
  { kind: "balloon", color: "#fff6e5", x: "18%", y: "70%", size: 70, depth: 1.7 },
  { kind: "star", color: "#fff6e5", x: "45%", y: "6%", size: 36, depth: 0.8 },
  { kind: "star", color: "#fff6e5", x: "92%", y: "44%", size: 28, depth: 1.2 },
  { kind: "star", color: "#fff6e5", x: "4%", y: "46%", size: 24, depth: 2.2 },
  { kind: "dot", color: "#fff6e5", x: "58%", y: "86%", size: 22, depth: 1.5 },
  { kind: "dot", color: "#fff6e5", x: "32%", y: "30%", size: 14, depth: 2.4 },
] as const;

export default function Parties() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-depth]").forEach(el => {
        const depth = Number(el.dataset.depth);
        gsap.fromTo(el, { y: 160 * depth, rotate: -10 * depth }, {
          y: -160 * depth,
          rotate: 10 * depth,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
      gsap.from("[data-occasion]", {
        yPercent: 100,
        duration: 1,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-occasions]", start: "top 85%" },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="parties" className="relative overflow-hidden bg-red px-(--gut) py-[clamp(110px,16vw,240px)] text-cream">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {FLOATERS.map((f, i) => (
          <span key={i} data-depth={f.depth} className="absolute block" style={{ left: f.x, top: f.y, width: f.size, color: f.color }}>
            {f.kind === "balloon" && (
              <svg viewBox="0 0 60 90" className="w-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <ellipse cx="30" cy="30" rx="26" ry="30" fill="currentColor" />
                <ellipse cx="21" cy="19" rx="6" ry="9" fill="#fff" opacity="0.35" />
                <path d="M27 60h6l-3 5z" fill="currentColor" />
                <path d="M30 65c-4 8 4 14 0 24" stroke="#fff6e5" strokeWidth="1.2" fill="none" opacity="0.7" />
              </svg>
            )}
            {f.kind === "star" && <svg viewBox="0 0 24 24" className="w-full"><path fill="currentColor" d="M12 0l3 9h9l-7 5.5 2.7 9.5-7.7-6-7.7 6L7 14.5 0 9h9z" /></svg>}
            {f.kind === "dot" && <span className="block aspect-square w-full rounded-full bg-current" />}
          </span>
        ))}
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center text-center">
        <h2 data-reveal className="display text-[clamp(3.6rem,11vw,11rem)]">
          Make it<br />an occasion.
        </h2>
        <ul data-occasions className="mt-12 flex flex-wrap justify-center gap-3">
          {OCCASIONS.map(o => (
            <li key={o} className="overflow-hidden rounded-full">
              <span data-occasion className="block rounded-full border border-cream/50 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em]">{o}</span>
            </li>
          ))}
        </ul>
        <p data-reveal className="mt-10 max-w-lg text-lg text-cream/85">
          Tell us the date and the headcount, and we&apos;ll help you plan a party they&apos;ll talk about for years.
        </p>
        <div data-reveal className="mt-10 flex flex-wrap justify-center gap-3">
          <PillLink href={site.links.booking} tone="yellow" external>Book an event</PillLink>
          <PillLink href={site.whatsapp} tone="ghost" external>WhatsApp us</PillLink>
        </div>
      </div>
    </section>
  );
}
