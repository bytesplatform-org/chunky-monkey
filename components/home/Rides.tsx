"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { rides, site } from "@/data/site";
import { prefersReducedMotion } from "@/lib/animation/prefs";
import CtaLink from "./CtaLink";
import LiquidImage from "./LiquidImage";

gsap.registerPlugin(ScrollTrigger);

/** Each card's colour, in turn along the hand. */
const TONES = ["bg-blue text-cream", "bg-pink text-night", "bg-green text-night", "bg-orange text-night", "bg-red text-cream", "bg-yellow text-night"];

/** How the hand fans out: degrees per card, and how far the outer cards drop (px, times distance from the middle squared). */
const FAN = { turn: 5.5, drop: 5 };
/** What pointing at a card does: how far it rises, how much bigger it gets, and how far its neighbours slide aside (px). */
const LIFT = { rise: 56, scale: 1.1, aside: 62 };

/**
 * The rides as a hand of collectible cards. The hand fans open as it scrolls
 * in; pointing at a card lifts it and slides its neighbours aside. Which card
 * is meant comes from the pointer's place along the hand, not the cards under
 * it, so it can't flicker as they move, and a lifted card keeps the pointer
 * until it actually leaves. Phones and tablets get a swipe row.
 */
export default function Rides() {
  const hand = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const el = hand.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1025px)", () => {
      const reduced = prefersReducedMotion();
      const middle = (rides.length - 1) / 2;
      let open = reduced ? 1 : 0;
      let active = -1;
      let spread = 0;

      const lay = (duration: number) => {
        cards.current.forEach((card, i) => {
          if (!card) return;
          const from = i - middle;
          const on = i === active;
          const aside = active < 0 || on ? 0 : Math.sign(i - active) * LIFT.aside;
          card.style.zIndex = String(on ? 50 : i + 1);
          gsap.to(card, {
            x: (from * spread + aside) * open,
            y: (from * from * FAN.drop) * open - (on ? LIFT.rise : 0),
            rotate: on ? 0 : from * FAN.turn * open,
            scale: on ? LIFT.scale : 1,
            duration: reduced ? 0 : duration,
            ease: "power3.out",
            overwrite: "auto",
          });
        });
      };

      const measure = () => {
        const cardWidth = cards.current[0]?.offsetWidth ?? 0;
        // room for the outer cards to lean out without leaving the screen
        spread = (el.clientWidth - cardWidth * 1.5) / (rides.length - 1);
        lay(0);
      };
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      measure();

      const onMove = (e: PointerEvent) => {
        // a lifted card is wider than its place along the hand: it stays lifted for as long as the pointer is on it
        const lifted = active >= 0 ? cards.current[active]?.getBoundingClientRect() : null;
        if (lifted && e.clientX >= lifted.left && e.clientX <= lifted.right && e.clientY >= lifted.top && e.clientY <= lifted.bottom) return;
        const r = el.getBoundingClientRect();
        const next = Math.max(0, Math.min(rides.length - 1, Math.round((e.clientX - (r.left + r.width / 2)) / spread + middle)));
        if (next === active || open < 0.9) return;
        active = next;
        lay(0.45);
      };
      const onLeave = () => {
        active = -1;
        lay(0.6);
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);

      const trigger = reduced ? undefined : ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        end: "top 42%",
        onUpdate: self => {
          open = gsap.parseEase("power2.out")(self.progress);
          lay(0.35);
        },
      });

      return () => {
        ro.disconnect();
        trigger?.kill();
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
        cards.current.forEach(card => {
          if (!card) return;
          gsap.killTweensOf(card);
          gsap.set(card, { clearProps: "all" });
        });
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <section id="rides" className="relative overflow-hidden pb-[clamp(96px,12vw,170px)] pt-[clamp(64px,7vw,100px)]">
      <div className="flex flex-col items-start justify-between gap-6 px-(--gut) md:flex-row md:items-end">
        <h2 data-reveal className="display text-[clamp(3.2rem,7.2vw,8rem)]">Find your<br />kind of fun.</h2>
        <div data-reveal className="flex max-w-md flex-col items-start gap-5">
          <p className="text-lg leading-snug">From fast and thrilling to gentle and nostalgic, there&apos;s a ride for every age and every mood.</p>
          <CtaLink href={site.links.rides} tone="blue" external>View all rides</CtaLink>
        </div>
      </div>

      <div
        ref={hand}
        data-lenis-prevent-touch
        className="mx-(--gut) mt-[clamp(40px,5vw,72px)] flex gap-4 max-lg:-mx-0 max-lg:snap-x max-lg:snap-mandatory max-lg:scroll-px-(--gut) max-lg:overflow-x-auto max-lg:px-(--gut) max-lg:pb-5 max-lg:[scrollbar-width:none] lg:relative lg:block lg:h-[clamp(470px,36vw,640px)]"
      >
        {rides.map((ride, i) => (
          <article
            key={ride.name}
            ref={el => { cards.current[i] = el; }}
            className={`slab flex w-[clamp(240px,70vw,300px)] shrink-0 cursor-pointer snap-start flex-col gap-3 rounded-[24px] p-2.5 pb-4 [--lift:6px] lg:absolute lg:left-1/2 lg:top-[56px] lg:-ml-[calc(clamp(210px,20vw,330px)/2)] lg:w-[clamp(210px,20vw,330px)] lg:origin-bottom ${TONES[i % TONES.length]}`}
          >
            <LiquidImage src={ride.image} alt={`${ride.name} ride at Chunky Monkey`} sizes="(min-width: 1024px) 22vw, 72vw" className="aspect-[4/5] rounded-[16px] bg-night/10" />
            <div className="px-1.5">
              <h3 className="display text-[clamp(1.6rem,2.2vw,2.3rem)]">{ride.name}</h3>
              <p className="mt-1 leading-snug">{ride.line}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
