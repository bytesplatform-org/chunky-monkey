/**
 * One persistent canvas, one WebGLRenderer and one visual tick for every
 * visual on the page. Passes register with the stage and draw in order each
 * frame; the stage alone sizes the drawing buffer and clears the frame.
 *
 * The tick rides gsap.ticker, the same clock that drives Lenis and every
 * ScrollTrigger, so scroll-scrubbed uniforms and the page never drift apart.
 */

import * as THREE from "three";
import gsap from "gsap";

export type Frame = {
  /** seconds since the stage started (pauses while the tab is hidden) */
  time: number;
  /** seconds since the last frame, capped */
  dt: number;
  /** canvas size, CSS px */
  width: number;
  height: number;
  dpr: number;
  scrollY: number;
};

export type Pass = {
  /** called once up front and on every resize */
  resize?(width: number, height: number, dpr: number): void;
  render(renderer: THREE.WebGLRenderer, frame: Frame): void;
  dispose(): void;
};

export type Stage = {
  renderer: THREE.WebGLRenderer;
  /** adds a pass (drawn after the ones already added); returns its removal */
  add(pass: Pass): () => void;
  dispose(): void;
};

export type StageOptions = {
  /** device pixel ratio ceiling, for fill-rate on dense screens */
  maxDpr?: number;
  antialias?: boolean;
};

/** Returns null when WebGL is unavailable, so the caller can fall back to HTML. */
export function createStage(canvas: HTMLCanvasElement, opts: StageOptions = {}): Stage | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: opts.antialias ?? true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  renderer.setClearColor(0, 0);
  renderer.autoClear = false;

  const passes: Pass[] = [];
  const maxDpr = opts.maxDpr ?? 2;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let needsResize = true;
  let time = 0;
  let contextLost = false;

  const measure = () => { needsResize = true; };
  window.addEventListener("resize", measure, { passive: true });
  const observer = new ResizeObserver(measure);
  observer.observe(canvas);

  const tick = (_time: number, deltaMs: number) => {
    if (contextLost || document.hidden) return;
    if (needsResize) {
      needsResize = false;
      width = Math.max(1, canvas.clientWidth);
      height = Math.max(1, canvas.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      passes.forEach(pass => pass.resize?.(width, height, dpr));
    }
    const dt = Math.min(deltaMs, 50) / 1000;
    time += dt;
    const frame: Frame = { time, dt, width, height, dpr, scrollY: window.scrollY };
    renderer.clear();
    for (const pass of passes) pass.render(renderer, frame);
  };

  // Three restores GPU resources lazily on the next render after a restore.
  const onContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
  };
  const onContextRestored = () => {
    contextLost = false;
    needsResize = true;
  };
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  gsap.ticker.add(tick);

  return {
    renderer,
    add(pass) {
      passes.push(pass);
      pass.resize?.(width, height, dpr);
      needsResize = true;
      return () => {
        const i = passes.indexOf(pass);
        if (i < 0) return;
        passes.splice(i, 1);
        pass.dispose();
      };
    },
    dispose() {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", measure);
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      passes.splice(0).forEach(pass => pass.dispose());
      renderer.dispose();
    },
  };
}
