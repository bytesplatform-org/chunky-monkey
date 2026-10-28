"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Vector2 } from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStage } from "@/components/gl/GLStage";
import { createShaderPass } from "@/lib/gl/shaderPass";
import { createCarnival } from "@/lib/scenes/carnival";
import { skyFragment } from "@/lib/shaders/sky";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/animation/prefs";
import { onReady } from "@/lib/animation/ready";
import type { Pass } from "@/lib/gl/stage";
import { site } from "@/data/site";
import PillLink from "./PillLink";

gsap.registerPlugin(ScrollTrigger);

const TITLE = [
  { word: "Fun", colors: ["text-red", "text-yellow", "text-green"] },
  { word: "for", colors: ["text-blue", "text-pink", "text-orange"] },
  { word: "all.", colors: ["text-yellow", "text-green", "text-red", "text-cream"] },
];

/**
 * The opening scene: a pinned, full-screen 3D carnival under a GLSL sky.
 * Scrolling the hero carries the camera in toward the wheel and the sky from
 * dusk into night, while the headline hands over to a second line.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useStage();

  // ---- the WebGL scene, on the shared stage
  useEffect(() => {
    const section = root.current;
    if (!stage || !section) return;
    const reduced = prefersReducedMotion();
    const coarse = isCoarsePointer();

    const sky = createShaderPass({
      fragmentShader: skyFragment,
      uniforms: {
        uProgress: { value: 0 },
        uPointer: { value: new Vector2() },
        uFireworks: { value: coarse ? 0 : 1 },
      },
    });
    const carnival = createCarnival({ coarse });
    carnival.state.intro = reduced ? 1 : 0;

    // Both passes stand down once the hero has scrolled away (the page covers the canvas).
    let visible = true;
    const frozen = (frame: Parameters<Pass["render"]>[1]) => (reduced ? { ...frame, time: 4, dt: 0 } : frame);
    const passes: Pass[] = [sky, carnival.pass].map(pass => ({
      resize: pass.resize,
      render: (renderer, frame) => { if (visible) pass.render(renderer, frozen(frame)); },
      dispose: pass.dispose,
    }));
    const removers = passes.map(pass => stage.add(pass));

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      onUpdate: self => {
        const p = Math.min(1, self.progress / 0.72);
        carnival.state.progress = p;
        sky.uniforms.uProgress.value = p;
        visible = self.progress < 1;
      },
    });

    const onPointer = (e: PointerEvent) => {
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = -((e.clientY / innerHeight) * 2 - 1);
      carnival.state.pointer.set(x, y);
      (sky.uniforms.uPointer.value as Vector2).set(x, y);
    };
    if (!coarse) window.addEventListener("pointermove", onPointer, { passive: true });

    const offReady = onReady(() => {
      if (!reduced) gsap.to(carnival.state, { intro: 1, duration: 3.2, ease: "power3.out" });
    });

    return () => {
      offReady();
      gsap.killTweensOf(carnival.state);
      trigger.kill();
      window.removeEventListener("pointermove", onPointer);
      removers.forEach(remove => remove());
    };
  }, [stage]);

  // ---- the DOM: headline intro, then a scrubbed hand-over to the second line
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
          gsap.to(chars, { yPercent: 0, rotate: 0, opacity: 1, filter: "blur(0px)", duration: 1.3, ease: "expo.out", stagger: 0.045, delay: 0.5, clearProps: "filter" });
          gsap.to(fades, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, delay: 1.1 });
        });
      }
      gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: true } })
        .to("[data-hero-main]", { yPercent: -18, opacity: 0, filter: "blur(10px)", ease: "none", duration: 0.35 }, 0)
        .fromTo("[data-hero-second]", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, ease: "none", duration: 0.25 }, 0.4)
        .to("[data-hero-second]", { opacity: 0, yPercent: -10, ease: "none", duration: 0.2 }, 0.8)
        .to("[data-hero-bar]", { scaleX: 1, ease: "none", duration: 1 }, 0);
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="top" className="relative h-[280vh]" aria-label="Chunky Monkey">
      <div className="sticky top-0 h-lvh overflow-hidden">
        {/* static fallback, hidden while WebGL runs */}
        <div className="gl-fallback absolute inset-0">
          <Image src="/media/park.jpg" alt="The Chunky Monkey park entrance lit up at dusk" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-night/55" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night/90 to-transparent" />

        <div data-hero-main className="relative flex h-full flex-col justify-end px-(--gut) pb-[clamp(96px,14vh,160px)]">
          <p data-hero-fade className="eyebrow mb-5 flex items-center gap-3 text-cream/80">
            <span className="size-2 animate-pulse rounded-full bg-green shadow-[0_0_12px_var(--color-green)]" />
            Open daily · {site.hours.time}
          </p>
          <h1 className="display text-[25vw] sm:text-[clamp(4.5rem,17vw,17rem)]" aria-label="Fun for all.">
            {TITLE.map(({ word, colors }) => (
              <span key={word} className="mr-[0.18em] block sm:inline-block">
                {word.split("").map((ch, i) => (
                  <span key={i} data-char aria-hidden className={`neon inline-block ${colors[i % colors.length]}`}>{ch}</span>
                ))}
              </span>
            ))}
          </h1>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <p data-hero-fade className="max-w-md text-lg leading-snug text-cream/85 sm:text-xl">
              Rides, food and big nights out for the whole family, across Karachi and Hyderabad.
            </p>
            <div data-hero-fade className="flex flex-wrap gap-3">
              <PillLink href="#rides" tone="yellow">Explore the rides</PillLink>
              <PillLink href={site.links.booking} tone="ghost" external>Book a party</PillLink>
            </div>
          </div>
        </div>

        <div data-hero-second aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center px-(--gut) text-center opacity-0">
          <p className="display max-w-[14ch] text-[clamp(3rem,9vw,9rem)]">
            When the sun goes down, <span className="neon text-yellow">the park lights up.</span>
          </p>
        </div>

        <div className="absolute inset-x-(--gut) bottom-8 flex items-center justify-between gap-6 text-cream/70">
          <span className="eyebrow">Karachi · Hyderabad</span>
          <span className="eyebrow hidden flex-1 items-center gap-4 sm:flex">
            <span className="h-px flex-1 bg-cream/20">
              <span data-hero-bar className="block h-full origin-left scale-x-0 bg-yellow" />
            </span>
            Scroll to switch on the lights
          </span>
        </div>
      </div>
    </section>
  );
}
