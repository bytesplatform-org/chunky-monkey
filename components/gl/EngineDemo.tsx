"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStagePass } from "./GLStage";
import { createShaderPass } from "@/lib/gl/shaderPass";
import { createScenePass } from "@/lib/gl/scenePass";
import { NOISE } from "@/lib/shaders/noise";
import { prefersReducedMotion } from "@/lib/animation/prefs";

gsap.registerPlugin(ScrollTrigger);

const BACKDROP = /* glsl */ `
uniform float uTime;
uniform vec2  uResolution;
uniform float uScroll;
uniform float uProgress;
varying vec2  vUv;

${NOISE}

void main() {
  vec2 p = vUv * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;
  vec2 warp = field(p + uTime * 0.05) * 1.5;
  float n = noise(p + warp + vec2(0.0, uScroll * 0.0008));
  vec3 a = vec3(0.04, 0.05, 0.10);
  vec3 b = mix(vec3(0.18, 0.24, 1.0), vec3(0.95, 0.35, 0.55), uProgress);
  gl_FragColor = vec4(mix(a, b, smoothstep(0.35, 0.9, n) * 0.6), 1.0);
}
`;

/** Wiring check for the engine: a GLSL backdrop, a 3D mesh and Lenis-driven ScrollTriggers. */
export default function EngineDemo() {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef({ value: 0 });

  useStagePass(() => {
    const pass = createShaderPass({ fragmentShader: BACKDROP, uniforms: { uProgress: progress.current } });
    return pass;
  });

  useStagePass(() => {
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1, 0.32, 220, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5f2ea, roughness: 0.25, metalness: 0.6 }),
    );
    const pass = createScenePass({
      update: ({ dt }) => {
        knot.rotation.x = progress.current.value * Math.PI * 2;
        knot.rotation.y += dt * 0.2;
      },
    });
    pass.scene.add(knot, new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(3, 4, 5);
    pass.scene.add(key);
    return pass;
  });

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: self => { progress.current.value = self.progress; },
      });
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach(el => {
        gsap.from(el, {
          y: 60,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="text-white">
      {["GLSL", "Three.js", "GSAP", "Lenis"].map(label => (
        <section key={label} className="flex h-dvh items-center justify-center">
          <h2 data-reveal className="text-6xl font-semibold tracking-tight sm:text-8xl">{label}</h2>
        </section>
      ))}
    </div>
  );
}
