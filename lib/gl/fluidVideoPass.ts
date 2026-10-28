/**
 * The fluid video transition as a stage pass: one subdivided plane, one
 * VideoTexture, carried from a card rect to a panel rect as a flexible sheet
 * (see lib/shaders/fluidVideoTransition.ts). It knows nothing about scroll —
 * set `progress` (0..1) from a GSAP timeline or ScrollTrigger and the next
 * frame draws that state.
 *
 * Rects are in canvas CSS px (y down); call `layout` whenever they move.
 */

import * as THREE from "three";
import { fluidFragmentShader, fluidVertexShader } from "@/lib/shaders/fluidVideoTransition";
import { cornersAt, sizeOf, type Rect } from "./sheet";
import type { Pass } from "./stage";

export type FluidVideoPass = Pass & {
  layout(from: Rect, to: Rect): void;
  /** transition progress 0..1 */
  progress: number;
  /** 0 normal · 1 undistorted · 2 distortion map */
  debugMode: number;
  strength: number;
};

export type FluidVideoOptions = {
  video: HTMLVideoElement;
  segments?: [number, number];
  /** corner radius at progress 0 and 1, CSS px */
  radius?: [number, number];
  strength?: number;
  /** blue wash on the card, faded out as it grows (0 = none) */
  tint?: number;
};

export function createFluidVideoPass(opts: FluidVideoOptions): FluidVideoPass {
  const segments = opts.segments ?? [72, 48];
  const radius = opts.radius ?? [18, 28];
  const tint = opts.tint ?? 0.4;

  const texture = new THREE.VideoTexture(opts.video);
  // The shader writes the sampled colour straight out, and the renderer adds
  // no output conversion for a ShaderMaterial — so leaving the texture
  // untagged (NoColorSpace) passes the video's sRGB values through unchanged.
  texture.colorSpace = THREE.NoColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const uniforms = {
    uTexture: { value: texture },
    uEnvelope: { value: 0 },
    uTime: { value: 0 },
    uStrength: { value: opts.strength ?? 1 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uImageResolution: { value: new THREE.Vector2(16, 9) },
    uCanvas: { value: new THREE.Vector2(1, 1) },
    uC0: { value: new THREE.Vector2() },
    uC1: { value: new THREE.Vector2() },
    uC2: { value: new THREE.Vector2() },
    uC3: { value: new THREE.Vector2() },
    uRadius: { value: radius[0] },
    uTintAmount: { value: tint },
    uDebug: { value: 0 },
  };

  const geometry = new THREE.PlaneGeometry(1, 1, segments[0], segments[1]);
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: fluidVertexShader,
    fragmentShader: fluidFragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false; // the vertex shader writes clip space directly
  const scene = new THREE.Scene();
  scene.add(mesh);
  const camera = new THREE.Camera();

  let from: Rect = { x: 0, y: 0, w: 1, h: 1 };
  let to: Rect = { x: 0, y: 0, w: 1, h: 1 };

  const pass: FluidVideoPass = {
    progress: 0,
    debugMode: 0,
    strength: opts.strength ?? 1,

    layout(a, b) {
      from = a;
      to = b;
    },

    resize(width, height) {
      uniforms.uCanvas.value.set(width, height);
    },

    render(renderer) {
      const t = pass.progress;
      const vw = opts.video.videoWidth;
      const vh = opts.video.videoHeight;
      if (vw && vh) uniforms.uImageResolution.value.set(vw, vh);
      const corners = cornersAt(from, to, t);
      uniforms.uC0.value.set(...corners[0]);
      uniforms.uC1.value.set(...corners[1]);
      uniforms.uC2.value.set(...corners[2]);
      uniforms.uC3.value.set(...corners[3]);
      const [w, h] = sizeOf(corners);
      uniforms.uResolution.value.set(Math.max(w, 1), Math.max(h, 1));
      uniforms.uEnvelope.value = Math.sin(Math.PI * t);
      uniforms.uTime.value = t * 3; // progress-derived: frozen when idle
      uniforms.uRadius.value = radius[0] + (radius[1] - radius[0]) * t;
      const tintProgress = Math.min(1, Math.max(0, (t - 0.05) / 0.8));
      uniforms.uTintAmount.value = tint * (1 - tintProgress * tintProgress * (3 - 2 * tintProgress));
      uniforms.uDebug.value = pass.debugMode;
      uniforms.uStrength.value = pass.strength;
      renderer.render(scene, camera);
    },

    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };

  return pass;
}
