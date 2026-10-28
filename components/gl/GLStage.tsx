"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createStage, type Pass, type Stage } from "@/lib/gl/stage";

const StageContext = createContext<Stage | null>(null);

/**
 * Mounts the page's one fixed, full-viewport canvas behind its children and
 * shares the stage with them. Sections add passes with useStagePass.
 * While WebGL runs, <html data-gl> is set, so CSS can hide static fallbacks.
 */
export default function GLStage({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<Stage | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const created = createStage(canvas, { maxDpr: 1.75 });
    if (created) document.documentElement.setAttribute("data-gl", "");
    setStage(created);
    return () => {
      created?.dispose();
      document.documentElement.removeAttribute("data-gl");
      setStage(null);
    };
  }, []);

  return (
    <StageContext.Provider value={stage}>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 h-lvh w-full"
      />
      {children}
    </StageContext.Provider>
  );
}

/** The shared stage, or null before mount / without WebGL. */
export function useStage() {
  return useContext(StageContext);
}

/**
 * Adds the pass `create` returns while the component is mounted. `create`
 * runs once the stage exists, and again if a dependency changes.
 */
export function useStagePass(create: (stage: Stage) => Pass | null, deps: unknown[] = []) {
  const stage = useStage();
  useEffect(() => {
    if (!stage) return;
    const pass = create(stage);
    return pass ? stage.add(pass) : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, ...deps]);
}
