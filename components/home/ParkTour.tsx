"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStage } from "@/components/gl/GLStage";
import { RIDES } from "@/components/park/tour";
import { prefersReducedMotion } from "@/lib/animation/prefs";
import { lockScroll } from "@/lib/animation/scroll";
import { loadHeroModels } from "@/lib/scenes/heroModels";
import { captionFor, isOpening, parkTour } from "@/lib/scenes/parkTour";

gsap.registerPlugin(ScrollTrigger);

/** Scroll distance of the tour: the pace of /park's. */
const TOUR_LENGTH = "1810lvh";

const OPENING = { title: "The park", line: "A drone tour, from the gate to the swing ride. Pick any ride to look around it." };

/** A press that travels further than this is a drag, not a pick (px). */
const DRAG = 6;

const captionAtProgress = (p: number) => (isOpening(p) ? OPENING : captionFor(p));

/**
 * A window in the page onto the stage: the park again, from the top view the
 * hero ended on, then the /park drone tour scrubbed by scroll. Rides name
 * themselves under the cursor, and picking one takes the camera off the tour to
 * orbit it, as on /park. It stays out of the page until the park is loaded, and
 * for good under reduced motion or without WebGL.
 */
export default function ParkTour() {
  const root = useRef<HTMLElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const stage = useStage();
  const [shown, setShown] = useState<{ title: string; line: string } | null>(OPENING);
  const [orbiting, setOrbiting] = useState(false);
  const orbitingNow = useRef(false);

  useEffect(() => {
    const section = root.current;
    const surface = view.current;
    if (!stage || !section || !surface || prefersReducedMotion()) return;
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
          if (!orbitingNow.current) setShown(captionAtProgress(self.progress));
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

      // ---- pointing at the rides
      const point = (ride: string | null) => {
        parkTour.explorer?.highlight(ride);
        if (ride) surface.dataset.cursor = RIDES[ride]; // Cursor shows it beside the pointer
        else delete surface.dataset.cursor;
        surface.style.cursor = ride ? "pointer" : orbitingNow.current ? "grab" : "";
      };
      let frame = 0;
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch" || e.buttons) return;
        cancelAnimationFrame(frame);
        const { clientX, clientY } = e;
        frame = requestAnimationFrame(() => point(parkTour.explorer?.rideAt(clientX, clientY) ?? null));
      };
      const onLeave = () => {
        cancelAnimationFrame(frame);
        point(null);
      };
      let down = { x: 0, y: 0 };
      const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
      const onClick = (e: MouseEvent) => {
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG) return;
        const explorer = parkTour.explorer;
        const ride = explorer?.rideAt(e.clientX, e.clientY);
        if (!explorer || !ride) return;
        explorer.focus(ride, surface);
        orbitingNow.current = true;
        setOrbiting(true);
        setShown(null);
      };
      surface.addEventListener("pointermove", onMove);
      surface.addEventListener("pointerleave", onLeave);
      surface.addEventListener("pointerdown", onDown);
      surface.addEventListener("click", onClick);

      teardown = () => {
        scrub.kill();
        onScreen.kill();
        cancelAnimationFrame(frame);
        point(null);
        surface.removeEventListener("pointermove", onMove);
        surface.removeEventListener("pointerleave", onLeave);
        surface.removeEventListener("pointerdown", onDown);
        surface.removeEventListener("click", onClick);
        parkTour.explorer?.leave();
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

  const backToTour = () => {
    parkTour.explorer?.leave();
    orbitingNow.current = false;
    setOrbiting(false);
    setShown(captionAtProgress(parkTour.target));
  };

  // free orbit owns the wheel and touch; the page stays where the tour left it
  useEffect(() => {
    if (!orbiting) return;
    const lock = lockScroll();
    let locked = true;
    const unlock = () => {
      if (locked) lock();
      locked = false;
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") backToTour(); };
    // a link to elsewhere on the page has to find the page free to scroll, before this effect would be cleaned up
    const onAnchor = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('a[href^="#"]')) return;
      unlock();
      backToTour();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onAnchor, true);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onAnchor, true);
    };
  }, [orbiting]);

  return (
    <section ref={root} id="tour" aria-label="A drone tour of the park" className="relative hidden">
      <div aria-hidden className="awning text-cream" />
      <div className="sticky top-0 h-lvh overflow-hidden">
        {/* the orbit captures the pointer on this surface, so anything clickable has to sit beside it, not in it */}
        <div ref={view} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-(--gut) pb-[clamp(32px,6vh,64px)]" aria-live="polite">
          <div>
            {shown && (
              <div key={shown.title} className="park-caption slab max-w-md -rotate-1 rounded-3xl bg-yellow p-[clamp(20px,2.4vw,32px)] text-night">
                <p className="display text-[clamp(2.25rem,4vw,4rem)]">{shown.title}</p>
                <p className="mt-3 text-lg leading-snug">{shown.line}</p>
              </div>
            )}
          </div>
          {orbiting && (
            <button type="button" onClick={backToTour} className="chunky pointer-events-auto inline-flex h-13 shrink-0 cursor-pointer items-center rounded-2xl bg-cream px-6 font-semibold text-night hover:bg-white">
              Back to the tour
            </button>
          )}
        </div>
      </div>
      <div aria-hidden className="awning text-cream" style={{ top: "auto", bottom: -1, transform: "rotate(180deg)" }} />
    </section>
  );
}
