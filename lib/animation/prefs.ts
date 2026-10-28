/**
 * Environment probes. Read once at mount — never during render, so the
 * server and the first client pass always agree.
 */

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Tablets and phones: where expensive scenes should step down. */
export const COMPACT_QUERY = "(max-width: 1024px), (hover: none) and (pointer: coarse)";

export function isCoarsePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/** Resolves when webfonts are ready, or after `timeout` — whichever is first. */
export function fontsReady(timeout = 1200): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return Promise.resolve();
  }
  return Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((r) => setTimeout(r, timeout)),
  ]);
}
