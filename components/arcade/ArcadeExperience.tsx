"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, useProgress } from "@react-three/drei";
import { lockScroll } from "@/lib/animation/scroll";
import ArcadeLoader from "./ArcadeLoader";
import ArcadeScene from "./ArcadeScene";
import { SPAWN, SPEED, newInput, speedWith } from "./walk";

/** Radians of look per pixel: of mouse movement, and of finger drag. */
const MOUSE_LOOK = 0.0022;
const TOUCH_LOOK = 0.005;

/** Browsers now and then report a huge jump on one mouse event; no real flick moves this far in one. */
const MAX_MOUSE_STEP = 200;

/** How far the joystick's knob travels, px. */
const STICK_REACH = 44;

/** Keys the walk uses; the page mustn't also act on them (Space scrolling, Alt opening a menu, Ctrl+S saving). */
const WALK_KEYS = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "KeyQ", "Space",
  "ControlLeft", "ControlRight", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight",
]);

/** The left-hand move stick on touch screens. */
function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const knob = useRef<HTMLDivElement>(null);
  const place = (e: ReactPointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const v = new THREE.Vector2(e.clientX - box.left - box.width / 2, e.clientY - box.top - box.height / 2);
    if (v.length() > STICK_REACH) v.setLength(STICK_REACH);
    if (knob.current) knob.current.style.transform = `translate(${v.x}px, ${v.y}px)`;
    onMove(v.x / STICK_REACH, -v.y / STICK_REACH);
  };
  const release = () => {
    if (knob.current) knob.current.style.transform = "";
    onMove(0, 0);
  };
  return (
    <div
      className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-6 z-20 grid size-32 touch-none place-items-center rounded-full border border-[#fff6e5]/30 bg-[#14121f]/50"
      aria-hidden
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); place(e); }}
      onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) place(e); }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div ref={knob} className="size-12 rounded-full bg-[#fff6e5]/80" />
    </div>
  );
}

/**
 * The /arcade page: the arcade on a full-screen canvas and a first-person walk
 * through it, by pointer lock and keys, or on touch screens a joystick and a
 * drag to look.
 */
export default function ArcadeExperience() {
  const input = useRef(newInput());
  const stage = useRef<HTMLDivElement>(null);
  const [touch] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [speed, setSpeed] = useState<number>(SPEED.initial);
  const [dpr, setDpr] = useState(1.5);
  const { progress } = useProgress();

  const active = locked || touch;
  const onReady = useCallback(() => setReady(true), []);

  const showSpeed = useCallback(() => setSpeed(speedWith(input.current.speed, input.current.keys)), []);

  // nothing here scrolls; the wheel belongs to the walk's speed
  useEffect(() => lockScroll(), []);

  useEffect(() => {
    const element = stage.current;
    const onChange = () => {
      const on = document.pointerLockElement === element;
      setLocked(on);
      if (!on) {
        input.current.keys.clear();
        showSpeed();
      }
    };
    document.addEventListener("pointerlockchange", onChange);
    return () => {
      document.removeEventListener("pointerlockchange", onChange);
      if (document.pointerLockElement === element) document.exitPointerLock();
    };
  }, [showSpeed]);

  useEffect(() => {
    if (!active) return;
    const io = input.current;
    const onKey = (e: KeyboardEvent) => {
      if (!WALK_KEYS.has(e.code)) return;
      e.preventDefault();
      if (e.type === "keydown") io.keys.add(e.code);
      else io.keys.delete(e.code);
      showSpeed();
    };
    // a key released while the window is away never reports its keyup
    const onBlur = () => { io.keys.clear(); showSpeed(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("blur", onBlur);
    };
  }, [active, showSpeed]);

  useEffect(() => {
    if (!locked) return;
    const io = input.current;
    const onMouse = (e: MouseEvent) => {
      const dx = THREE.MathUtils.clamp(e.movementX, -MAX_MOUSE_STEP, MAX_MOUSE_STEP);
      const dy = THREE.MathUtils.clamp(e.movementY, -MAX_MOUSE_STEP, MAX_MOUSE_STEP);
      io.look.yaw -= dx * MOUSE_LOOK;
      io.look.pitch -= dy * MOUSE_LOOK;
    };
    const onWheel = (e: WheelEvent) => {
      io.speed = THREE.MathUtils.clamp(io.speed * Math.exp(-e.deltaY * 0.0015), SPEED.min, SPEED.max);
      showSpeed();
    };
    document.addEventListener("mousemove", onMouse);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMouse);
      window.removeEventListener("wheel", onWheel);
    };
  }, [locked, showSpeed]);

  const enter = () => {
    if (touch || locked) return;
    // the browser refuses a re-lock for a moment after Esc: the overlay just stays up, ready for the next click
    stage.current?.requestPointerLock()?.catch(() => {});
  };

  const lastDrag = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#14121f] text-[#fff6e5]">
      <div ref={stage} className={`absolute inset-0 ${active ? "" : "cursor-pointer"}`} onClick={enter}>
        <Canvas
          dpr={[1, dpr]}
          camera={{ fov: 70, near: 0.05, far: 140, position: [...SPAWN.position] }}
          gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
        >
          <PerformanceMonitor onChange={({ factor }) => setDpr(Math.round((1 + factor) * 4) / 4)} />
          <Suspense fallback={null}>
            <ArcadeScene inputRef={input} active={active} onReady={onReady} />
          </Suspense>
        </Canvas>
      </div>

      {touch && (
        <>
          {/* drag anywhere on the right half to look */}
          <div
            className="absolute inset-y-0 right-0 z-10 w-1/2 touch-none"
            aria-hidden
            onPointerDown={e => {
              e.currentTarget.setPointerCapture(e.pointerId);
              lastDrag.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerMove={e => {
              const last = lastDrag.current;
              if (!last) return;
              input.current.look.yaw -= (e.clientX - last.x) * TOUCH_LOOK;
              input.current.look.pitch -= (e.clientY - last.y) * TOUCH_LOOK;
              lastDrag.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={() => { lastDrag.current = null; }}
            onPointerCancel={() => { lastDrag.current = null; }}
          />
          <Joystick onMove={(x, y) => { input.current.stick.x = x; input.current.stick.y = y; }} />
        </>
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-6 p-[clamp(20px,3vw,40px)]">
        <h1 className="display rounded-lg bg-[#14121f]/70 px-3 py-1 text-[clamp(1.8rem,3.5vw,2.75rem)]">Arcade</h1>
        <div className="flex shrink-0 items-center gap-4">
          {!touch && <p className="rounded-lg bg-[#14121f]/70 px-3 py-2 text-sm tabular-nums text-[#fff6e5]/85">{speed.toFixed(1)} m/s</p>}
          <button
            type="button"
            onClick={() => { input.current.reset = true; }}
            className="pointer-events-auto rounded-full bg-[#fff6e5] px-5 py-2.5 text-sm font-medium text-[#14121f] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff6e5]"
          >
            Reset view
          </button>
        </div>
      </header>

      {!touch && (
        <p className="pointer-events-none absolute bottom-[clamp(20px,3vw,40px)] left-[clamp(20px,3vw,40px)] z-20 max-w-[calc(100vw-40px)] rounded-lg bg-[#14121f]/70 px-3 py-2 text-sm text-[#fff6e5]/85">
          WASD move · Q/E down/up · Shift fast · Scroll speed · Esc release
        </p>
      )}

      {ready && !active && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
          <p className="rounded-full bg-[#14121f]/80 px-5 py-2.5 text-sm font-medium">Click to explore</p>
        </div>
      )}

      <ArcadeLoader progress={ready ? 100 : Math.min(progress, 99)} done={ready} />
    </div>
  );
}
