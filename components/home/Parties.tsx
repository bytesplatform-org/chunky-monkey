"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/data/site";
import { prefersReducedMotion } from "@/lib/animation/prefs";
import CtaLink from "./CtaLink";
import Snapshot from "./Snapshot";

gsap.registerPlugin(ScrollTrigger);

const OCCASIONS = ["Birthdays", "School trips", "Family get-togethers", "Corporate nights"];

/** Balloons and bits of confetti, each drifting at its own depth as the section scrolls by. The balloons pop. */
const FLOATERS = [
  { kind: "balloon", color: "var(--color-yellow)", x: "6%", y: "10%", size: 90, depth: 1.4 },
  { kind: "balloon", color: "var(--color-red)", x: "84%", y: "8%", size: 120, depth: 2 },
  { kind: "balloon", color: "var(--color-pink)", x: "93%", y: "40%", size: 80, depth: 1.1 },
  { kind: "balloon", color: "var(--color-green)", x: "17%", y: "34%", size: 70, depth: 1.7 },
  { kind: "star", color: "var(--color-yellow)", x: "45%", y: "6%", size: 36, depth: 0.8 },
  { kind: "star", color: "var(--color-cream)", x: "74%", y: "6%", size: 28, depth: 1.2 },
  { kind: "star", color: "var(--color-cream)", x: "3%", y: "44%", size: 24, depth: 2.2 },
  { kind: "dot", color: "var(--color-yellow)", x: "22%", y: "12%", size: 22, depth: 1.5 },
  { kind: "dot", color: "var(--color-cream)", x: "80%", y: "32%", size: 14, depth: 2.4 },
] as const;

const CONFETTI = ["--color-yellow", "--color-cream", "--color-red", "--color-pink", "--color-green"];

/** Bursts a balloon into confetti where it floats; it blows back up a few seconds later. */
function pop(balloon: HTMLElement) {
  if (balloon.dataset.popped) return;
  balloon.dataset.popped = "true";
  const reduced = prefersReducedMotion();
  if (!reduced) {
    const box = balloon.getBoundingClientRect();
    for (let i = 0; i < 18; i++) {
      const bit = document.createElement("span");
      bit.className = "fixed block size-2.5 rounded-[2px] pointer-events-none z-10";
      bit.style.background = `var(${CONFETTI[i % CONFETTI.length]})`;
      bit.style.left = `${box.left + box.width / 2}px`;
      bit.style.top = `${box.top + box.width / 2}px`;
      document.body.append(bit);
      const angle = (i / 18) * Math.PI * 2 + gsap.utils.random(-0.3, 0.3);
      const reach = gsap.utils.random(50, 150);
      gsap.to(bit, { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach + 40, rotate: gsap.utils.random(-300, 300), opacity: 0, duration: gsap.utils.random(0.6, 1), ease: "power2.out", onComplete: () => bit.remove() });
    }
  }
  gsap.timeline({ onComplete: () => { delete balloon.dataset.popped; } })
    .to(balloon, { scale: reduced ? 1 : 1.25, duration: reduced ? 0 : 0.06 })
    .set(balloon, { scale: 0, opacity: 0 })
    .to(balloon, { scale: 1, opacity: 1, duration: reduced ? 0 : 0.7, ease: "back.out(2)" }, "+=3");
}

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
    <section ref={root} id="parties" className="relative overflow-hidden bg-blue px-(--gut) py-[clamp(110px,14vw,200px)] text-cream">
      <div aria-hidden className="awning text-night" />
      {/* the party, in photos, either side of the words */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[6%] hidden justify-between px-[3%] xl:flex">
        <div data-drift="30"><Snapshot src="/media/photos/monkey-board.jpg" alt="" sizes="20vw" className="aspect-square w-[17vw] -rotate-6" /></div>
        <div data-drift="50"><Snapshot src="/media/photos/selfie.jpg" alt="" sizes="20vw" className="aspect-square w-[17vw] rotate-6" /></div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* the ones low in the section would drift across the words on a narrow screen */}
        {FLOATERS.map((f, i) => (
          <span key={i} data-depth={f.depth} className={`absolute block max-md:scale-[0.55] ${parseInt(f.y) > 30 ? "max-md:hidden" : ""}`} style={{ left: f.x, top: f.y, width: f.size, color: f.color }}>
            {f.kind === "balloon" && (
              <button type="button" tabIndex={-1} data-cursor="Pop" onClick={e => pop(e.currentTarget)} className="pointer-events-auto block w-full cursor-pointer">
                <svg viewBox="-2 -2 64 94" className="balloon-bob w-full" stroke="var(--color-night)" strokeWidth="2" strokeLinejoin="round" style={{ animationDelay: `${-i * 0.7}s` }}>
                  <path d="M30 65c-4 8 4 14 0 24" fill="none" />
                  <path d="M27 60h6l2 5h-10z" fill="currentColor" />
                  <ellipse cx="30" cy="30" rx="26" ry="30" fill="currentColor" />
                  <ellipse cx="20" cy="18" rx="5" ry="8" fill="#fff" opacity="0.5" stroke="none" />
                </svg>
              </button>
            )}
            {f.kind === "star" && <svg viewBox="0 0 24 24" className="w-full"><path fill="currentColor" d="M12 0l3 9h9l-7 5.5 2.7 9.5-7.7-6-7.7 6L7 14.5 0 9h9z" /></svg>}
            {f.kind === "dot" && <span className="block aspect-square w-full rounded-full bg-current" />}
          </span>
        ))}
      </div>

      <div className="pointer-events-none relative mx-auto flex max-w-6xl flex-col items-center text-center [&_a]:pointer-events-auto">
        <h2 data-reveal className="display text-[clamp(3.6rem,11vw,11rem)]">
          Make it<br />an occasion.
        </h2>
        <ul data-occasions className="mt-12 flex flex-wrap justify-center gap-3">
          {OCCASIONS.map(o => (
            <li key={o} className="overflow-hidden rounded-full">
              <span data-occasion className="block rounded-full bg-cream px-5 py-2.5 font-semibold text-night">{o}</span>
            </li>
          ))}
        </ul>
        <p data-reveal className="mt-10 max-w-lg text-lg">
          Tell us the date and the headcount, and we&apos;ll help you plan a party they&apos;ll talk about for years.
        </p>
        <div data-reveal className="mt-10 flex flex-wrap justify-center gap-3">
          <CtaLink href={site.links.booking} external>Book an event</CtaLink>
          <CtaLink href={site.whatsapp} tone="cream" external>WhatsApp us</CtaLink>
        </div>
      </div>
    </section>
  );
}
