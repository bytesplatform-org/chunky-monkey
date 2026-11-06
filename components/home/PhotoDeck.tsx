"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/animation/prefs";
import LiquidImage from "./LiquidImage";

gsap.registerPlugin(Draggable);

const CARDS = [
  { src: "/media/photos/park-front.jpg", alt: "The Chunky Monkey building with its big logo over the entrance", title: "DHA Phase IV", note: "Karachi" },
  { src: "/media/photos/outdoor.jpg", alt: "Two friends mid-swing on an outdoor ride", title: "Outdoor rides", note: "For every age" },
  { src: "/media/photos/event.jpg", alt: "A birthday party set up with balloons", title: "Birthdays and events", note: "Room for 1200+" },
  { src: "/media/photos/indoor.jpg", alt: "A boy playing an arcade basketball game", title: "Indoor games", note: "Open till midnight" },
  { src: "/media/photos/ride-girl.jpg", alt: "A girl laughing on a ride", title: "Rides for the little ones", note: "And the brave" },
];

/** How each place in the pile sits, from the top card down. */
const PILE = [
  { x: 0, y: 0, rotate: -3, scale: 1 },
  { x: 16, y: 10, rotate: 4, scale: 0.97 },
  { x: -14, y: 18, rotate: -7, scale: 0.94 },
  { x: 10, y: 24, rotate: 8, scale: 0.91 },
  { x: -6, y: 28, rotate: -10, scale: 0.88 },
];

/** How far a card has to be dragged to count as thrown (px). */
const THROW = 90;

/** A pile of snapshots: click the top one, or throw it, and it goes to the bottom of the pile. */
export default function PhotoDeck() {
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<HTMLDivElement[]>([]);
  /** card indices, top of the pile first */
  const order = useRef(CARDS.map((_, i) => i));
  const next = useRef<(from?: { x: number; y: number }) => void>(() => {});

  const settle = useCallback((instant = false) => {
    order.current.forEach((card, place) => {
      const el = cards.current[card];
      gsap.set(el, { zIndex: CARDS.length - place });
      el.style.pointerEvents = place === 0 ? "auto" : "none";
      gsap.to(el, { ...PILE[place], duration: instant ? 0 : 0.6, ease: "back.out(1.6)", overwrite: "auto" });
    });
  }, []);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const els = cards.current;
    let busy = false;

    next.current = (from = { x: 1, y: -0.2 }) => {
      if (busy) return;
      const top = cards.current[order.current[0]];
      const send = () => {
        order.current.push(order.current.shift()!);
        settle(reduced);
      };
      if (reduced) return send();
      busy = true;
      const length = Math.hypot(from.x, from.y) || 1;
      gsap.to(top, {
        x: (from.x / length) * 520,
        y: (from.y / length) * 340,
        rotate: from.x >= 0 ? 16 : -16,
        duration: 0.32,
        ease: "power2.out",
        overwrite: true,
        onComplete: () => {
          // it comes back round behind the others
          order.current.push(order.current.shift()!);
          gsap.set(top, { zIndex: 0 });
          settle();
          busy = false;
        },
      });
    };

    settle(true);
    const drags = els.map(el => Draggable.create(el, {
      // a finger needs to keep scrolling the page up and down
      type: isCoarsePointer() ? "x" : "x,y",
      minimumMovement: 6,
      onClick() { next.current(); },
      onDragEnd() {
        const moved = { x: this.x as number, y: (this.y as number) };
        if (Math.hypot(moved.x, moved.y) > THROW) next.current(moved);
        else settle();
      },
    })[0]);
    return () => {
      drags.forEach(d => d.kill());
      els.forEach(el => gsap.killTweensOf(el));
    };
  }, [settle]);

  return (
    <div className="flex flex-col items-center gap-[clamp(32px,4vw,52px)]">
      <div ref={root} className="relative aspect-[1/1.02] w-full max-w-[min(100%,480px)]">
        {CARDS.map((card, i) => (
          <div
            key={card.src}
            ref={el => { if (el) cards.current[i] = el; }}
            data-cursor="Throw me"
            className="slab absolute inset-0 flex cursor-grab touch-pan-y select-none flex-col gap-3 rounded-[28px] bg-white p-3 pb-4 active:cursor-grabbing [--lift:8px]"
          >
            <LiquidImage src={card.src} alt={card.alt} sizes="(min-width: 1024px) 34vw, 86vw" className="min-h-0 flex-1 rounded-[18px] bg-night/10" />
            <div className="flex items-baseline justify-between gap-3 px-1.5 text-night">
              <h3 className="display text-[clamp(1.35rem,2vw,1.9rem)]">{card.title}</h3>
              <p className="shrink-0 font-medium">{card.note}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => next.current()}
        className="chunky inline-flex h-11 cursor-pointer items-center rounded-xl bg-cream px-4 font-semibold text-night [--lift:4px] hover:bg-white"
      >
        Next photo →
      </button>
    </div>
  );
}
