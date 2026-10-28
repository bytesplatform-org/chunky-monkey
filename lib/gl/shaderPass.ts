/**
 * A full-screen GLSL pass: one triangle covering the canvas, your fragment
 * shader on top. Built-in uniforms, updated every frame:
 *
 *   uTime        seconds (Frame.time)
 *   uResolution  canvas size in device px
 *   uScroll      window.scrollY in CSS px
 *
 * Extra uniforms go in `uniforms` and stay live — mutate `.value` from GSAP
 * (e.g. a ScrollTrigger scrub) and the next frame picks it up.
 */

import * as THREE from "three";
import type { Pass } from "./stage";

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export type ShaderPass = Pass & {
  uniforms: Record<string, THREE.IUniform>;
};

export function createShaderPass(opts: {
  fragmentShader: string;
  uniforms?: Record<string, THREE.IUniform>;
  transparent?: boolean;
}): ShaderPass {
  const uniforms: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uScroll: { value: 0 },
    ...opts.uniforms,
  };

  // One oversized triangle rather than a quad: no diagonal seam to shade twice.
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: opts.fragmentShader,
    transparent: opts.transparent ?? true,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false; // the vertex shader writes clip space directly
  const scene = new THREE.Scene();
  scene.add(mesh);
  const camera = new THREE.Camera();

  return {
    uniforms,
    resize(width, height, dpr) {
      (uniforms.uResolution.value as THREE.Vector2).set(width * dpr, height * dpr);
    },
    render(renderer, frame) {
      uniforms.uTime.value = frame.time;
      uniforms.uScroll.value = frame.scrollY;
      renderer.render(scene, camera);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
