"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { rides, site } from "@/data/site";
import ShaderImage from "./ShaderImage";
import CtaLink from "./CtaLink";

gsap.registerPlugin(ScrollTrigger);

/** the cards' colours, in turn along the run */
const TONES = ["bg-blue text-cream", "bg-pink text-night", "bg-green text-night", "bg-orange text-night", "bg-red text-cream", "bg-yellow text-night"];

/**
 * The rides as a pinned horizontal run on desktop: the page scrolls, the
 * cards travel sideways, each photo drawn through the wave shader. Phones and
 * tablets get a native swipe row instead of a pin.
 */
export default function Rides() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = root.current;
    const row = track.current;
    if (!section || !row) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1025px) and (prefers-reduced-motion: no-preference)", () => {
      const distance = () => row.scrollWidth - document.documentElement.clientWidth;
      const tween = gsap.to(row, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      // each card tilts a little as it crosses the screen
      gsap.utils.toArray<HTMLElement>("[data-ride]", row).forEach(card => {
        gsap.fromTo(card, { rotate: 4, y: 40 }, {
          rotate: -4,
          y: -40,
          ease: "none",
          scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
        });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} id="rides" className="relative overflow-hidden">
      <div className="flex min-h-lvh flex-col justify-center py-[clamp(80px,10vh,120px)]">
        <div className="mb-12 flex flex-col gap-6 px-(--gut) lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="display text-[clamp(3.2rem,8vw,8rem)]">
              Find your<br />kind of fun.
            </h2>
          </div>
          <div className="flex max-w-sm flex-col items-start gap-6">
            <p className="text-lg leading-snug">
              From fast and thrilling to gentle and nostalgic, there&apos;s a ride for every age and every mood.
            </p>
            <CtaLink href={site.links.rides} tone="blue" external>View all rides</CtaLink>
          </div>
        </div>

        <div
          ref={track}
          className="flex w-max gap-[clamp(16px,2vw,32px)] px-(--gut) max-lg:w-auto max-lg:snap-x max-lg:snap-mandatory max-lg:scroll-px-(--gut) max-lg:overflow-x-auto max-lg:pb-5 max-lg:[scrollbar-width:none]"
          data-lenis-prevent-touch
        >
          {rides.map((ride, i) => (
            <article key={ride.name} data-ride className="w-[clamp(260px,min(27vw,41lvh),420px)] shrink-0 snap-start">
              <div className={`slab rounded-[28px] p-3 transition-transform duration-300 hover:-translate-y-2 hover:rotate-1 ${TONES[i % TONES.length]}`}>
                <ShaderImage
                  src={ride.image}
                  alt={`${ride.name} ride at Chunky Monkey`}
                  sizes="(min-width: 1024px) 27vw, 70vw"
                  cursor="Ride"
                  className="aspect-[609/645] rounded-[18px] bg-night/10"
                />
                <div className="px-2 pb-2 pt-4">
                  <h3 className="display text-[clamp(1.75rem,2.6vw,2.5rem)]">{ride.name}</h3>
                  <p className="mt-1 leading-snug">{ride.line}</p>
                </div>
              </div>
            </article>
          ))}
          <a
            href={site.links.rides}
            target="_blank"
            rel="noopener noreferrer"
            className="slab grid w-[clamp(240px,22vw,340px)] shrink-0 snap-start place-items-center rounded-[28px] bg-night p-8 text-center text-yellow transition-colors hover:bg-blue hover:text-cream"
          >
            <span className="display text-5xl">See every<br />ride →</span>
          </a>
        </div>
      </div>
    </section>
  );
}
