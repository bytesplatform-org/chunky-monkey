/**
 * The liquid hover for plain photos. A page can hold only about 16 WebGL
 * contexts and has more photos than that, but only one or two are ever under
 * the cursor or still settling: a few canvases are kept and lent out, laid over
 * the <img> for as long as it's moving. The photo itself stays a plain <img>.
 */

import * as THREE from "three";
import gsap from "gsap";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/animation/prefs";
import { liquidImageFragment } from "@/lib/shaders/liquidImage";
import { createLiquidField } from "./liquidField";
import { createShaderCanvas } from "./shaderCanvas";

/** Enough for one photo under the cursor and a couple still settling behind it. */
const CANVASES = 3;

type Slot = {
  canvas: HTMLCanvasElement;
  field: ReturnType<typeof createLiquidField>;
  uniforms: { uTexture: THREE.IUniform; uFlow: THREE.IUniform; uImageRes: THREE.IUniform; uHover: THREE.IUniform };
  owner: HTMLElement | null;
  hovered: boolean;
  /** when it was last lent, to pick the one to take back if all are out */
  lentAt: number;
};

const slots: Slot[] = [];

function release(slot: Slot) {
  gsap.killTweensOf(slot.uniforms.uHover);
  slot.canvas.remove();
  (slot.uniforms.uTexture.value as THREE.Texture | null)?.dispose();
  slot.uniforms.uTexture.value = null;
  slot.owner = null;
  slot.hovered = false;
}

function createSlot(): Slot | null {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "pointer-events-none absolute inset-0 size-full";
  const field = createLiquidField();
  const uniforms = {
    uTexture: { value: null },
    uFlow: { value: field.texture },
    uImageRes: { value: new THREE.Vector2(1, 1) },
    uHover: { value: 0 },
  };
  const slot: Slot = { canvas, field, uniforms, owner: null, hovered: false, lentAt: 0 };
  try {
    createShaderCanvas(canvas, {
      fragmentShader: liquidImageFragment,
      uniforms,
      animate: false,
      onFrame: (_time, deltaMs) => {
        if (!slot.owner) return;
        field.settle(deltaMs / 1000);
        if (!slot.hovered && !field.moving && uniforms.uHover.value < 0.005) release(slot);
      },
    });
  } catch {
    field.dispose();
    return null;
  }
  return slot;
}

/** A free canvas, a new one while there's room, or else the one lent out longest ago. */
function borrow(): Slot | null {
  const free = slots.find(s => !s.owner);
  if (free) return free;
  if (slots.length < CANVASES) {
    const slot = createSlot();
    if (slot) slots.push(slot);
    return slot;
  }
  const oldest = slots.reduce((a, b) => (a.lentAt < b.lentAt ? a : b));
  release(oldest);
  return oldest;
}

/** Makes the photo `img` inside `el` flow under the cursor. Returns the teardown. */
export function attachLiquid(el: HTMLElement, img: HTMLImageElement) {
  if (isCoarsePointer() || prefersReducedMotion()) return () => {};
  let slot: Slot | null = null;
  let last: { x: number; y: number } | null = null;
  const mine = () => (slot?.owner === el ? slot : null);

  // a responsive <img> reports a size scaled for the screen, not its pixels: a texture needs the real ones
  let source: HTMLImageElement | null = null;
  let over = false;

  const onEnter = () => {
    over = true;
    last = null;
    if (!img.complete || !img.naturalWidth) return;
    if (!source) {
      source = new Image();
      source.onload = () => { if (over) onEnter(); };
      source.src = img.currentSrc;
    }
    if (!source.complete || !source.naturalWidth) return;
    const held = mine() ?? borrow();
    slot = held;
    if (!held) return;
    if (held.owner !== el) {
      const texture = new THREE.Texture(source);
      texture.colorSpace = THREE.NoColorSpace;
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
      texture.needsUpdate = true;
      held.field.reset();
      held.uniforms.uTexture.value = texture;
      (held.uniforms.uImageRes.value as THREE.Vector2).set(source.naturalWidth, source.naturalHeight);
      held.uniforms.uHover.value = 0;
      held.owner = el;
      held.lentAt = performance.now();
      el.append(held.canvas);
    }
    held.hovered = true;
    gsap.to(held.uniforms.uHover, { value: 1, duration: 0.8, ease: "power2.out", overwrite: true });
  };
  const onMove = (e: PointerEvent) => {
    const held = mine();
    if (!held) return void (over || onEnter());
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;
    if (last) held.field.drag(x, y, x - last.x, y - last.y, r.width / Math.max(r.height, 1));
    last = { x, y };
  };
  const onLeave = () => {
    over = false;
    const held = mine();
    if (!held) return;
    held.hovered = false;
    gsap.to(held.uniforms.uHover, { value: 0, duration: 0.8, ease: "power2.out", overwrite: true });
  };

  el.addEventListener("pointerenter", onEnter);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);
  return () => {
    el.removeEventListener("pointerenter", onEnter);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
    const held = mine();
    if (held) release(held);
  };
}
