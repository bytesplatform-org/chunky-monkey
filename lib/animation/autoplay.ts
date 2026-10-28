import gsap from "gsap";
import { isProgrammaticScroll, nudgeScroll, onScrollInput } from "@/lib/animation/scroll";

type AutoplayOptions = {
  /** page scroll where the band starts */
  start: () => number;
  /** page scroll where the band ends */
  end: () => number;
  /** seconds to cross the whole band on its own, at speed 1 */
  seconds: number;
  /** speed multiplier at scroll y (defaults to 1) */
  speedAt?: (y: number, start: number, end: number) => number;
  /** how firmly the scroller eases toward each push */
  lerp?: number;
  /** share of the reader's own scrolling that adds to the pace (0..1) */
  influence?: number;
};

/** Input this recent counts as the reader steering into the band. */
const INPUT_FRESH_MS = 600;

/**
 * Carries the page across a scroll band once the reader moves into it, for a
 * scroll-scrubbed transition: the page keeps going on its own to the band's
 * far end, in the direction they were moving. It pushes the same scroll
 * target the wheel does, so scrolling the same way adds (some) speed, and
 * scrolling the other way turns it round, any number of times. It stops at
 * either end of the band. Needs Lenis; without it, nothing happens.
 */
export function createScrollAutoplay(opts: AutoplayOptions) {
  const lerp = opts.lerp ?? 0.22;
  const influence = opts.influence ?? 0.3;
  let direction = 0;
  /** The scroll target the autoplay set last frame. */
  let lastSet: number | null = null;
  let lastInput = { direction: 0, at: -Infinity };
  const offInput = onScrollInput(deltaY => {
    if (!deltaY) return;
    lastInput = { direction: Math.sign(deltaY), at: performance.now() };
    if (direction) direction = lastInput.direction;
  });
  let lastY = window.scrollY;
  const drive = (_time: number, deltaMs: number) => {
    const top = opts.start();
    const bottom = opts.end();
    const y = window.scrollY;
    const moved = y - lastY;
    lastY = y;
    // A jump or glide (back to top, say) passes straight through the band.
    if (isProgrammaticScroll()) {
      direction = 0;
      lastSet = null;
      return;
    }
    if (bottom - top < 2) return;
    if (!direction) {
      if (y <= top + 1 || y >= bottom - 1) return;
      // Steered in by recent input, or eased in by the scroller's glide after
      // the input has gone quiet: either way, carry on in that direction.
      const heading = performance.now() - lastInput.at < INPUT_FRESH_MS ? lastInput.direction : Math.abs(moved) > 0.5 ? Math.sign(moved) : 0;
      if (!heading) return;
      direction = heading;
      lastSet = null;
    }
    // Arrived at the end it was heading for, or carried out of the band.
    if ((direction > 0 && y >= bottom - 1) || (direction < 0 && y <= top + 1) || y < top - 1 || y > bottom + 1) {
      direction = 0;
      lastSet = null;
      return;
    }
    const speed = opts.speedAt?.(y, top, bottom) ?? 1;
    const step = (direction * (bottom - top) / opts.seconds) * speed * (Math.min(deltaMs, 50) / 1000);
    const heading = direction;
    nudgeScroll(target => {
      // Whatever the reader's input added to the target since our last push
      // counts only partly; the autoplay's own pace does the rest.
      const base = lastSet ?? y;
      let from = base + (target - base) * influence;
      // Never push from behind the page in the direction of travel...
      from = heading > 0 ? Math.max(from, y) : Math.min(from, y);
      // ...and never past the band's end.
      const next = heading > 0 ? Math.min(bottom, from + step) : Math.max(top, from + step);
      lastSet = next;
      return next;
    }, lerp);
  };
  gsap.ticker.add(drive);
  return {
    kill() {
      gsap.ticker.remove(drive);
      offInput();
    },
  };
}
