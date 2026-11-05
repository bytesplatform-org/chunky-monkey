"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStage } from "@/components/gl/GLStage";
import { prefersReducedMotion } from "@/lib/animation/prefs";
import { loadHeroModels } from "@/lib/scenes/heroModels";
import { captionFor, isOpening, parkTour } from "@/lib/scenes/parkTour";

gsap.registerPlugin(ScrollTrigger);

/** Scroll distance of the tour: the pace of /park's. */
const TOUR_LENGTH = "1560lvh";

const OPENING = { title: "The park", line: "A drone tour, from the gate to the bumper cars." };

/**
 * A window in the page onto the stage: the park again, from the top view the
 * hero ended on, then the /park drone tour scrubbed by scroll. It stays out of
 * the page until the park is loaded, and for good under reduced motion or
 * without WebGL.
 */
export default function ParkTour() {
  const root = useRef<HTMLElement>(null);
  const stage = useStage();
  const [shown, setShown] = useState<{ title: string; line: string } | null>(OPENING);

  useEffect(() => {
    const section = root.current;
    if (!stage || !section || prefersReducedMotion()) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    loadHeroModels().then(() => {
      if (cancelled) return;
      section.style.display = "block";
      section.style.height = TOUR_LENGTH;
      const scrub = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: self => {
          parkTour.target = self.progress;
          setShown(isOpening(self.progress) ? OPENING : captionFor(self.progress));
        },
      });
      const onScreen = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: self => {
          parkTour.target = scrub.progress;
          parkTour.active = self.isActive;
        },
      });
      ScrollTrigger.refresh();
      teardown = () => {
        scrub.kill();
        onScreen.kill();
        parkTour.active = false;
        section.style.display = "";
        section.style.height = "";
      };
    }, () => { /* no model: the tour stays out of the page */ });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [stage]);

  return (
    <section ref={root} id="tour" aria-label="A drone tour of the park" className="relative hidden">
      <div aria-hidden className="awning text-cream" />
      <div className="sticky top-0 h-lvh overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-(--gut) pb-[clamp(32px,6vh,64px)]" aria-live="polite">
          <div>
            {shown && (
              <div key={shown.title} className="park-caption slab max-w-md -rotate-1 rounded-3xl bg-yellow p-[clamp(20px,2.4vw,32px)] text-night">
                <p className="display text-[clamp(2.25rem,4vw,4rem)]">{shown.title}</p>
                <p className="mt-3 text-lg leading-snug">{shown.line}</p>
              </div>
            )}
          </div>
          <a href="#attractions" className="chunky inline-flex h-13 shrink-0 items-center rounded-2xl bg-cream px-6 font-semibold text-night hover:bg-white">
            Skip tour
          </a>
        </div>
      </div>
      <div aria-hidden className="awning text-cream" style={{ top: "auto", bottom: -1, transform: "rotate(180deg)" }} />
    </section>
  );
}
