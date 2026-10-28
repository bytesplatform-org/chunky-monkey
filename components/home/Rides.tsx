"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { rides, site } from "@/data/site";
import ShaderImage from "./ShaderImage";
import PillLink from "./PillLink";

gsap.registerPlugin(ScrollTrigger);

const EDGES = ["#ef3b39", "#ffc93c", "#4cc35a", "#3b5bff", "#ff4fa3", "#ff7a2f"];

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
      const distance = () => row.scrollWidth - window.innerWidth;
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
    <section ref={root} id="rides" className="relative overflow-hidden bg-cream text-night">
      <div className="flex min-h-lvh flex-col justify-center py-[clamp(80px,10vh,120px)]">
        <div className="mb-12 flex flex-col gap-6 px-(--gut) lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow mb-5 text-red">02 / Park rides</p>
            <h2 className="display text-[clamp(3.2rem,8vw,8rem)]">
              Find your<br />kind of <span className="text-red">fun.</span>
            </h2>
          </div>
          <div className="flex max-w-sm flex-col items-start gap-6">
            <p className="text-lg leading-snug text-night/70">
              From fast and thrilling to gentle and nostalgic, there&apos;s a ride for every age and every mood.
            </p>
            <PillLink href={site.links.rides} tone="dark" external>View all rides</PillLink>
          </div>
        </div>

        <div
          ref={track}
          className="flex w-max gap-[clamp(16px,2vw,32px)] px-(--gut) max-lg:w-auto max-lg:snap-x max-lg:snap-mandatory max-lg:overflow-x-auto max-lg:pb-4 max-lg:[scrollbar-width:none]"
          data-lenis-prevent-touch
        >
          {rides.map((ride, i) => (
            <article key={ride.name} data-ride className="group w-[clamp(260px,27vw,420px)] shrink-0 snap-start">
              <ShaderImage
                src={ride.image}
                alt={`${ride.name} ride at Chunky Monkey`}
                sizes="(min-width: 1024px) 27vw, 70vw"
                cursor="Ride"
                edge={EDGES[i % EDGES.length]}
                className="aspect-[609/645] rounded-[28px] bg-night/10"
              />
              <div className="mt-5 flex items-start gap-4">
                <span className="display mt-1 text-2xl" style={{ color: EDGES[i % EDGES.length] }}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="display text-[clamp(2rem,3vw,3rem)]">{ride.name}</h3>
                  <p className="mt-1 text-night/65">{ride.line}</p>
                </div>
              </div>
            </article>
          ))}
          <a
            href={site.links.rides}
            target="_blank"
            rel="noopener noreferrer"
            className="grid w-[clamp(240px,22vw,340px)] shrink-0 snap-start place-items-center rounded-[28px] bg-night p-8 text-center text-cream transition-colors hover:bg-red"
          >
            <span className="display text-5xl">See every<br />ride →</span>
          </a>
        </div>
      </div>
    </section>
  );
}
