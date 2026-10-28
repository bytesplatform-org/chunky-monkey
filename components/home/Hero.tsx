"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStage } from "@/components/gl/GLStage";
import { createCoaster, RIDE } from "@/lib/scenes/coaster";
import { loadCoaster } from "@/lib/scenes/coasterModel";
import { prefersReducedMotion } from "@/lib/animation/prefs";
import { onReady } from "@/lib/animation/ready";
import { site } from "@/data/site";
import PillLink from "./PillLink";

gsap.registerPlugin(ScrollTrigger);

const TITLE = ["Fun", "for", "all."];

/** How long the hero pins while the ride runs: the scroll distance of the whole ride. */
const RIDE_LENGTH = "1100lvh";

/** Share of the hero's scroll spent riding; the rest holds on the closing line. */
const RIDE_SHARE = 0.92;

/**
 * The opening scene: a front-seat coaster ride, scrubbed by scroll. Once the
 * ride is built, the hero grows to RIDE_LENGTH and pins; its scroll progress
 * picks the moment on the track, and the camera eases after it. Without
 * WebGL, the model, or with reduced motion, it stays one still screen. The headline
 * gives way as the ride starts, a callout comes up at the crest, and the ride
 * rolls into the station on the closing line.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useStage();

  // ---- the ride, on the shared stage
  useEffect(() => {
    const section = root.current;
    if (!stage || !section) return;
    const reduced = prefersReducedMotion();
    let cancelled = false;
    let teardown: (() => void) | undefined;

    loadCoaster().then(gltf => {
      if (cancelled) return;
      const coaster = createCoaster(gltf, { shake: !reduced });
      if (!reduced) section.style.height = RIDE_LENGTH;

      // stands down once the hero has scrolled away (the page covers the canvas)
      let visible = true;
      const remove = stage.add({
        resize: coaster.pass.resize,
        render: (renderer, frame) => { if (visible) coaster.pass.render(renderer, frame); },
        dispose: coaster.pass.dispose,
      });

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: self => {
          if (!reduced) coaster.state.target = RIDE.from + (RIDE.to - RIDE.from) * Math.min(1, self.progress / RIDE_SHARE);
        },
        onLeave: () => { visible = false; },
        onEnterBack: () => { visible = true; },
      });
      // the hero just grew to its ride length: re-measure every trigger below it
      ScrollTrigger.refresh();

      teardown = () => {
        trigger.kill();
        remove();
        section.style.height = "";
      };
    }, () => { /* no model: the static fallback stays */ });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [stage]);

  // ---- the words over the ride
  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const chars = gsap.utils.toArray<HTMLElement>("[data-char]");
      const fades = gsap.utils.toArray<HTMLElement>("[data-hero-fade]");
      if (!reduced) {
        gsap.set(chars, { yPercent: 70, rotate: 8, opacity: 0, filter: "blur(12px)" });
        gsap.set(fades, { opacity: 0, y: 24 });
        onReady(() => {
          gsap.to(chars, { yPercent: 0, rotate: 0, opacity: 1, filter: "blur(0px)", duration: 1.3, ease: "expo.out", stagger: 0.045, delay: 0.3, clearProps: "filter" });
          gsap.to(fades, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, delay: 0.9 });
        });
        // positions are fractions of the hero's scroll (the timeline is 1 long)
        gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: true } })
          .to("[data-hero-main]", { yPercent: -12, opacity: 0, ease: "none", duration: 0.05 }, 0.005)
          .fromTo("[data-hero-callout]", { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: "none", duration: 0.03 }, 0.06)
          .to("[data-hero-callout]", { opacity: 0, y: -30, ease: "none", duration: 0.03 }, 0.16)
          .to("[data-hero-dim]", { opacity: 0.6, ease: "none", duration: 0.06 }, 0.88)
          .fromTo("[data-hero-close]", { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, ease: "none", duration: 0.06 }, 0.89)
          .set({}, {}, 1);
      }
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="top" className="relative h-lvh" aria-label="Chunky Monkey">
      <div className="sticky top-0 h-lvh overflow-hidden">
        {/* static fallback, hidden while WebGL runs */}
        <div className="gl-fallback absolute inset-0">
          <Image src="/media/park.jpg" alt="The Chunky Monkey park entrance lit up at dusk" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-night/55" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night/85 to-transparent" />
        <div data-hero-dim aria-hidden className="pointer-events-none absolute inset-0 bg-night opacity-0" />

        <div data-hero-main className="relative flex h-full flex-col justify-end px-(--gut) pb-[clamp(56px,10vh,120px)]">
          <h1 className="display text-[30vw] sm:text-[clamp(5.5rem,19vw,19rem)]" aria-label="Fun for all.">
            {TITLE.map(word => (
              <span key={word} className="mr-[0.18em] block sm:inline-block">
                {word.split("").map((ch, i) => (
                  <span key={i} data-char aria-hidden className="inline-block">{ch}</span>
                ))}
              </span>
            ))}
          </h1>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <p data-hero-fade className="max-w-md text-lg leading-snug text-cream/85 sm:text-xl">
              Rides, food and big nights out for the whole family. Open every day, {site.hours.time}.
            </p>
            <div data-hero-fade className="flex flex-wrap gap-3">
              <PillLink href="#rides" tone="yellow">Explore the rides</PillLink>
              <PillLink href={site.links.booking} tone="ghost" external>Book a party</PillLink>
            </div>
          </div>
        </div>

        <p data-hero-callout aria-hidden className="display pointer-events-none absolute inset-x-0 top-[16%] text-center text-[clamp(2.5rem,8vw,7rem)] opacity-0">
          Hold on tight.
        </p>

        <div data-hero-close aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center px-(--gut) text-center opacity-0">
          <p className="display max-w-[12ch] text-[clamp(3.2rem,10vw,10rem)]">Welcome to the park.</p>
        </div>
      </div>
    </section>
  );
}
