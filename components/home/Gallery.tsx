"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gallery, site } from "@/data/site";
import { prefersReducedMotion } from "@/lib/animation/prefs";
import CtaLink from "./CtaLink";

gsap.registerPlugin(ScrollTrigger);

/** Two rows of photos sliding past each other in opposite directions as the page scrolls. */
export default function Gallery() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-gallery-row]").forEach((row, i) => {
        const travel = () => row.scrollWidth - document.documentElement.clientWidth;
        gsap.fromTo(row, { x: () => (i ? -travel() : 0) }, {
          x: () => (i ? 0 : -travel()),
          ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.5, invalidateOnRefresh: true },
        });
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="gallery" className="relative overflow-hidden bg-night py-[clamp(90px,10vw,150px)] text-cream">
      <div aria-hidden className="awning text-cream" />
      <div className="flex flex-col justify-between gap-6 px-(--gut) lg:flex-row lg:items-end">
        <h2 data-reveal className="display text-[clamp(3.2rem,8vw,8rem)] text-yellow">
          After dark,<br />it all lights up.
        </h2>
        <div data-reveal>
          <CtaLink href={site.links.gallery} external>See the full gallery</CtaLink>
        </div>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] flex flex-col gap-[clamp(12px,1.6vw,24px)]">
        {gallery.map((row, r) => (
          <div key={r} data-gallery-row className="flex w-max gap-[clamp(12px,1.6vw,24px)] px-(--gut)">
            {row.map(src => (
              <div key={src} className="relative aspect-square w-[clamp(180px,22vw,340px)] shrink-0 overflow-hidden rounded-3xl bg-dusk">
                <Image src={src} alt="" fill sizes="(min-width: 1024px) 22vw, 180px" className="object-cover transition-transform duration-500 hover:scale-110" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
