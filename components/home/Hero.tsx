"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStage } from "@/components/gl/GLStage";
import { createArcade } from "@/lib/scenes/arcade";
import { STOP, progressAtStop } from "@/lib/scenes/arcadePath";
import { loadArcade, loadHeroModels } from "@/lib/scenes/heroModels";
import { parkTour } from "@/lib/scenes/parkTour";
import { prefersReducedMotion } from "@/lib/animation/prefs";
import { onReady } from "@/lib/animation/ready";
import { site } from "@/data/site";
import CtaLink from "./CtaLink";

gsap.registerPlugin(ScrollTrigger);

/** How long the hero pins while the walk runs: the scroll distance of the whole walk. */
const WALK_LENGTH = "1000lvh";

/** Share of the hero's scroll spent walking; the rest holds on the closing line. */
const WALK_SHARE = 0.94;

/** Fraction of the hero's scroll at which the camera reaches a stop on the path. */
const atStop = (stop: number) => progressAtStop(stop) * WALK_SHARE;

/** What the walk passes, hung on the path's stops. */
const CAPTIONS = [
  { title: "The lobby", tone: "bg-pink", line: "Claw machines, air hockey and skee-ball under one ring of lights.", from: STOP.lobby - 0.8, to: STOP.lobby + 2.2 },
  { title: "The machine aisle", tone: "bg-yellow", line: "Racers, pinball and the classics, side by side.", from: STOP.aisle - 0.2, to: STOP.aisle + 1.4 },
  { title: "Bumper cars", tone: "bg-green", line: "Steer. Bump. Laugh. Repeat.", from: STOP.bumperCars - 0.1, to: STOP.bumperCars + 1.3 },
];

/**
 * The opening scene: a walk through the arcade, scrubbed by scroll. Once the
 * walk is built, the hero grows to WALK_LENGTH and pins; its scroll progress
 * picks the place on the path, and the camera eases after it. Without WebGL,
 * the model, or with reduced motion, it stays one still screen. The headline
 * gives way as the walk starts, a caption names each stretch as it's reached,
 * the walk goes out of the exit door into the daylight, and the camera comes to
 * rest above the park on the closing line.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useStage();

  // ---- the walk, on the shared stage
  useEffect(() => {
    const section = root.current;
    if (!stage || !section) return;
    const reduced = prefersReducedMotion();
    let cancelled = false;
    let teardown: (() => void) | undefined;

    const models = reduced ? loadArcade().then(arcade => ({ arcade })) : loadHeroModels();
    models.then(loaded => {
      if (cancelled) return;
      const arcade = createArcade(loaded, { tilt: !reduced });
      if (!reduced) section.style.height = WALK_LENGTH;

      // stands down once the hero has scrolled off the screen (the page covers the canvas),
      // until the drone tour opens a window in the page onto the park again
      let visible = true;
      const remove = stage.add({
        resize: arcade.pass.resize,
        render: (renderer, frame) => { if (visible || parkTour.active) arcade.pass.render(renderer, frame); },
        busy: () => visible || parkTour.active,
        dispose: arcade.pass.dispose,
      });

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: self => {
          if (!reduced) arcade.state.target = Math.min(1, self.progress / WALK_SHARE);
        },
      });
      const onScreen = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        onLeave: () => { visible = false; },
        onEnterBack: () => { visible = true; },
      });
      // the hero just grew to its walk length: re-measure every trigger below it
      ScrollTrigger.refresh();

      teardown = () => {
        trigger.kill();
        onScreen.kill();
        remove();
        section.style.height = "";
      };
    }, () => { /* no model: the static fallback stays */ });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [stage]);

  // ---- the words over the walk
  useEffect(() => {
    const section = root.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.set("[data-hero-title]", { yPercent: 105 });
      gsap.set("[data-hero-fade]", { opacity: 0, y: 16 });
      onReady(() => {
        gsap.to("[data-hero-title]", { yPercent: 0, duration: 1.1, ease: "expo.out", delay: 0.25 });
        gsap.to("[data-hero-fade]", { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08, delay: 0.6 });
      });
      // positions are fractions of the hero's scroll (the timeline is 1 long)
      const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: true } })
        .to("[data-hero-main]", { autoAlpha: 0, y: -24, ease: "none", duration: 0.035 }, 0.005);
      gsap.utils.toArray<HTMLElement>("[data-hero-caption]").forEach((caption, i) => {
        const { from, to } = CAPTIONS[i];
        tl.fromTo(caption, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, ease: "none", duration: 0.015 }, atStop(from))
          .to(caption, { autoAlpha: 0, y: -20, ease: "none", duration: 0.015 }, atStop(to));
      });
      // the room's dark edges clear on the way to the door, so they never sit over the daylight
      const onward = atStop(STOP.onward);
      tl.to("[data-hero-edge]", { autoAlpha: 0, ease: "none", duration: atStop(STOP.door - 1.4) - onward }, onward);
      tl.fromTo("[data-hero-shade]", { autoAlpha: 0 }, { autoAlpha: 1, ease: "none", duration: 0.04 }, 0.88)
        .fromTo("[data-hero-close]", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: "none", duration: 0.04 }, 0.9)
        .set({}, {}, 1);
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
        <div data-hero-edge aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-night/70 to-transparent" />
        <div data-hero-edge aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night/90 via-night/45 to-transparent" />

        <div data-hero-main className="absolute inset-x-0 bottom-0 flex flex-col gap-6 px-(--gut) pb-[clamp(32px,6vh,64px)] lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <h1 className="display overflow-hidden pb-[0.08em] text-yellow text-[clamp(3.5rem,15vw,5.5rem)] lg:text-[clamp(5.5rem,8.2vw,9.5rem)]">
            <span data-hero-title className="block">Fun for all.</span>
          </h1>
          <div className="flex max-w-md flex-col gap-5 lg:pb-[1vw]">
            <p data-hero-fade className="text-lg leading-snug text-cream/85">
              Rides, food and big nights out for the whole family. Open every day, {site.hours.time}.
            </p>
            <div data-hero-fade className="flex flex-wrap gap-3">
              <CtaLink href="#rides" tone="yellow">Explore the rides</CtaLink>
              <CtaLink href={site.links.booking} tone="cream" external>Book an event</CtaLink>
            </div>
          </div>
        </div>

        {CAPTIONS.map(caption => (
          <div key={caption.title} data-hero-caption aria-hidden className="pointer-events-none invisible absolute bottom-0 left-0 max-w-xl px-(--gut) pb-[clamp(32px,6vh,64px)] opacity-0">
            <div className={`slab -rotate-1 rounded-3xl p-[clamp(20px,2.4vw,32px)] text-night ${caption.tone}`}>
              <p className="display text-[clamp(2.25rem,4vw,4rem)]">{caption.title}</p>
              <p className="mt-3 text-lg leading-snug">{caption.line}</p>
            </div>
          </div>
        ))}

        {/* a low shade: the room's end is bright where the closing words land */}
        <div data-hero-shade aria-hidden className="pointer-events-none invisible absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night/90 via-night/50 to-transparent opacity-0" />
        <div data-hero-close className="invisible absolute inset-x-0 bottom-0 flex flex-col gap-6 px-(--gut) pb-[clamp(32px,6vh,64px)] opacity-0 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <p className="display text-yellow text-[clamp(3rem,12vw,5rem)] lg:text-[clamp(4.5rem,6.6vw,7.5rem)]">Come and play.</p>
          <div className="flex max-w-md flex-col gap-5 lg:pb-[0.8vw]">
            <p className="text-lg leading-snug text-cream/85">
              Two parks, open every day, {site.hours.time}.
            </p>
            <div className="flex flex-wrap gap-3">
              <CtaLink href="#rides" tone="yellow">Explore the rides</CtaLink>
              <CtaLink href={site.links.booking} tone="cream" external>Book an event</CtaLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
