/**
 * The liquid hover, for every photo on the page, on the page's one canvas. A
 * photo is a plain <img> until the cursor reaches it; then the stage lends its
 * canvas to the photo's frame, so whatever sits over or around the photo stays
 * over or around it, and takes it back once the photo has settled.
 */

import * as THREE from "three";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/animation/prefs";
import { FULLSCREEN_VERTEX } from "@/lib/shaders/noise";
import { liquidImageFragment } from "@/lib/shaders/liquidImage";
import type { Stage } from "./stage";
import { createLiquidField } from "./liquidField";

/** How quickly the push-in eases (per second), normally and when another photo is waiting for the canvas. */
const EASE = 3.5;
const EASE_HANDOFF = 22;
/** How much faster the flow dies away when another photo is waiting. */
const SETTLE_HANDOFF = 9;

type Photo = {
  el: HTMLElement;
  /** the picture at its real size: a responsive <img> reports one scaled for the screen, which a texture can't use */
  source: HTMLImageElement;
};

function createLiquid(stage: Stage) {
  const field = createLiquidField();
  const uniforms = {
    uTexture: { value: null as THREE.Texture | null },
    uFlow: { value: field.texture },
    uImageRes: { value: new THREE.Vector2(1, 1) },
    uFrame: { value: new THREE.Vector2(1, 1) },
    uHover: { value: 0 },
  };
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new THREE.ShaderMaterial({ vertexShader: FULLSCREEN_VERTEX, fragmentShader: liquidImageFragment, uniforms, depthTest: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);

  let current: Photo | null = null;
  let waiting: Photo | null = null;
  let hovered = false;

  const letGo = () => {
    uniforms.uTexture.value?.dispose();
    uniforms.uTexture.value = null;
    current = null;
    hovered = false;
  };

  const take = (photo: Photo) => {
    if (!stage.lendCanvas(photo.el, letGo)) return false;
    const texture = new THREE.Texture(photo.source);
    texture.colorSpace = THREE.NoColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.needsUpdate = true;
    field.reset();
    uniforms.uTexture.value = texture;
    uniforms.uImageRes.value.set(photo.source.naturalWidth, photo.source.naturalHeight);
    uniforms.uHover.value = 0;
    current = photo;
    hovered = true;
    return true;
  };

  stage.add({
    render(renderer, frame) {
      if (current) {
        // another photo is waiting: wrap this one up quickly
        field.settle(frame.dt * (waiting ? SETTLE_HANDOFF : 1));
        uniforms.uHover.value = THREE.MathUtils.damp(uniforms.uHover.value, hovered ? 1 : 0, waiting ? EASE_HANDOFF : EASE, frame.dt);
        if (!hovered && !field.moving && uniforms.uHover.value < 0.005) {
          letGo();
          stage.returnCanvas();
        }
      }
      if (!current && waiting && take(waiting)) waiting = null;
      if (!current) return;
      uniforms.uFrame.value.set(current.el.clientWidth, current.el.clientHeight);
      const toneMapping = renderer.toneMapping;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.render(scene, camera);
      renderer.toneMapping = toneMapping;
    },
    dispose() {
      letGo();
      quad.geometry.dispose();
      material.dispose();
      field.dispose();
    },
  });

  return {
    enter(photo: Photo) {
      if (current === photo) {
        hovered = true;
        waiting = null;
      } else {
        if (current) hovered = false;
        waiting = photo;
      }
    },
    drag(photo: Photo, x: number, y: number, dx: number, dy: number, aspect: number) {
      if (current === photo) field.drag(x, y, dx, dy, aspect);
      else if (waiting !== photo) this.enter(photo); // it was taken back while the cursor stayed here
    },
    leave(photo: Photo) {
      if (waiting === photo) waiting = null;
      if (current === photo) hovered = false;
    },
    forget(photo: Photo) {
      if (waiting === photo) waiting = null;
      if (current === photo) {
        letGo();
        stage.returnCanvas();
      }
    },
  };
}

const liquids = new WeakMap<Stage, ReturnType<typeof createLiquid>>();

/** Makes the photo `img` inside `el` flow under the cursor. Returns the teardown. */
export function attachLiquid(stage: Stage, el: HTMLElement, img: HTMLImageElement) {
  if (isCoarsePointer() || prefersReducedMotion()) return () => {};
  const liquid = liquids.get(stage) ?? createLiquid(stage);
  liquids.set(stage, liquid);

  let photo: Photo | null = null;
  let over = false;
  let last: { x: number; y: number } | null = null;

  const onEnter = () => {
    over = true;
    last = null;
    if (!img.complete || !img.naturalWidth) return;
    if (!photo) {
      const source = new Image();
      const loaded = { el, source };
      source.onload = () => {
        photo = loaded;
        if (over) liquid.enter(loaded);
      };
      source.src = img.currentSrc;
      return;
    }
    liquid.enter(photo);
  };
  const onMove = (e: PointerEvent) => {
    if (!photo) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;
    if (last) liquid.drag(photo, x, y, x - last.x, y - last.y, r.width / Math.max(r.height, 1));
    last = { x, y };
  };
  const onLeave = () => {
    over = false;
    if (photo) liquid.leave(photo);
  };

  el.addEventListener("pointerenter", onEnter);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);
  return () => {
    el.removeEventListener("pointerenter", onEnter);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
    if (photo) liquid.forget(photo);
  };
}
