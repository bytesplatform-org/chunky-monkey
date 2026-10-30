"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, useProgress } from "@react-three/drei";
import { jumpTo, lockScroll, onScrollInput } from "@/lib/animation/scroll";
import ParkScene, { type Mode } from "./ParkScene";
import ParkLoader from "./ParkLoader";
import { CAPTIONS, RIDES } from "./tour";

/** Scroll distance of one lap of the tour. */
const TOUR_LENGTH = "1300lvh";

const scrollMax = () => document.documentElement.scrollHeight - window.innerHeight;

/**
 * The /park page: the park on a fixed canvas, a tall page whose scroll
 * scrubs the drone tour (wrapping round at either end, since the tour is a
 * loop), and the overlay — title, ride captions, hover tooltip, and the
 * switch between the tour and free orbit.
 */
export default function ParkExperience() {
  const [mode, setMode] = useState<Mode>("tour");
  const [hovered, setHovered] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ ride: string; at: number } | null>(null);
  const [caption, setCaption] = useState(-1);
  const [ready, setReady] = useState(false);
  const [dpr, setDpr] = useState(1.5);
  const { progress } = useProgress();
  const tip = useRef<HTMLDivElement>(null);

  const onReady = useCallback(() => setReady(true), []);
  const onPick = useCallback((ride: string) => {
    setMode("free");
    setFocus({ ride, at: performance.now() });
  }, []);

  // the tour is a loop: off the bottom of the page comes back in at the top, and the reverse
  useEffect(() => {
    if (mode !== "tour") return;
    const onScroll = () => {
      const max = scrollMax();
      if (max > 0 && window.scrollY >= max - 1) jumpTo(1);
    };
    const offInput = onScrollInput(dy => {
      if (dy < 0 && window.scrollY <= 1) jumpTo(scrollMax() - 2);
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      offInput();
      window.removeEventListener("scroll", onScroll);
    };
  }, [mode]);

  // free orbit owns the wheel and touch; the page stays where the tour left it
  useEffect(() => (mode === "free" ? lockScroll() : undefined), [mode]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hovered]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (tip.current) tip.current.style.transform = `translate3d(${e.clientX + 16}px, ${e.clientY + 18}px, 0)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const shown = caption >= 0 ? CAPTIONS[caption] : null;

  return (
    <div className="relative bg-[#ffd9b2] text-[#1d1633]">
      <div className="fixed inset-0">
        <Canvas
          shadows="percentage"
          dpr={[1, dpr]}
          camera={{ fov: 40, near: 0.5, far: 900, position: [34, 28, 40] }}
          gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping }}
          onPointerMissed={() => setHovered(null)}
        >
          <PerformanceMonitor onChange={({ factor }) => setDpr(Math.round((1 + factor) * 4) / 4)} />
          <Suspense fallback={null}>
            <ParkScene
              mode={mode}
              hovered={hovered}
              focus={focus}
              onHover={setHovered}
              onPick={onPick}
              onCaption={setCaption}
              onReady={onReady}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* the scroll the tour runs on */}
      <div aria-hidden style={{ height: mode === "tour" ? TOUR_LENGTH : undefined }} className="pointer-events-none h-lvh" />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-10 flex items-start justify-between gap-6 p-[clamp(20px,3vw,40px)]">
        <h1 className="display text-[clamp(2.2rem,4.5vw,3.75rem)]">Chunky Monkey</h1>
        <button
          type="button"
          onClick={() => { setFocus(null); setMode(mode === "tour" ? "free" : "tour"); }}
          className="pointer-events-auto shrink-0 rounded-full bg-[#1d1633] px-5 py-2.5 text-sm font-medium text-[#fff6e5] transition-colors hover:bg-[#3a2d63] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d1633]"
        >
          {mode === "tour" ? "Skip tour" : "Back to the tour"}
        </button>
      </header>

      <div className="pointer-events-none fixed bottom-0 left-0 z-10 p-[clamp(20px,3vw,40px)]" aria-live="polite">
        {shown && (
          <div key={shown.title} className="park-caption max-w-sm">
            <p className="display text-[clamp(2.4rem,5vw,4.25rem)]">{shown.title}</p>
            <p className="mt-2 text-base text-[#1d1633]/80 sm:text-lg">{shown.line}</p>
          </div>
        )}
      </div>

      <div
        ref={tip}
        className={`pointer-events-none fixed left-0 top-0 z-20 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium shadow-sm transition-opacity duration-150 ${hovered ? "opacity-100" : "opacity-0"}`}
      >
        {hovered ? RIDES[hovered] : ""}
      </div>

      <ParkLoader progress={ready ? 100 : Math.min(progress, 99)} done={ready} />
    </div>
  );
}
