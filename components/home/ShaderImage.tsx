"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createShaderCanvas } from "@/lib/gl/shaderCanvas";
import { imageWaveFragment } from "@/lib/shaders/imageWave";
import { prefersReducedMotion } from "@/lib/animation/prefs";
import { onReady } from "@/lib/animation/ready";

gsap.registerPlugin(ScrollTrigger);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * A photo drawn through the image-wave shader: dissolves in on scroll along
 * a neon edge, bends with scroll speed, parallaxes, and ripples under the
 * cursor. The plain <Image> stays underneath for SEO, reduced motion and
 * no-WebGL; WebGL only starts when the frame nears the viewport.
 */
export default function ShaderImage({
  src,
  alt,
  className = "",
  sizes = "(min-width: 1024px) 40vw, 90vw",
  cursor,
  edge = "#ffc93c",
  focus = [0.5, 0.5],
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  cursor?: string;
  /** colour of the dissolve edge */
  edge?: string;
  /** where the cover crop centres, as object-position fractions [x, y from the top] */
  focus?: [number, number];
}) {
  const [focusX, focusY] = focus;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gl, setGl] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas || prefersReducedMotion()) return;

    let killed = false;
    let dispose: (() => void) | undefined;

    const start = () => {
      new THREE.TextureLoader().load(src, texture => {
        if (killed) return texture.dispose();
        texture.colorSpace = THREE.NoColorSpace;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        const image = texture.image as HTMLImageElement;

        const pointerTarget = new THREE.Vector2(0.5, 0.5);
        const uniforms = {
          uTexture: { value: texture },
          uImageRes: { value: new THREE.Vector2(image.naturalWidth, image.naturalHeight) },
          uFocus: { value: new THREE.Vector2(focusX, focusY) },
          uReveal: { value: 0 },
          uVelocity: { value: 0 },
          uParallax: { value: 0 },
          uHover: { value: 0 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uEdge: { value: new THREE.Color(edge) },
        };

        let lastY = window.scrollY;
        let velocity = 0;
        let shader: ReturnType<typeof createShaderCanvas>;
        try {
          shader = createShaderCanvas(canvas, {
            fragmentShader: imageWaveFragment,
            uniforms,
            transparent: true,
            onFrame: (_time, deltaMs) => {
              const y = window.scrollY;
              const speed = (y - lastY) / Math.max(deltaMs, 1);
              lastY = y;
              velocity += (clamp(speed / 4, -1, 1) - velocity) * 0.12;
              uniforms.uVelocity.value = velocity;
              const r = el.getBoundingClientRect();
              uniforms.uParallax.value = clamp((r.left + r.width / 2 - innerWidth / 2) / innerWidth + (r.top + r.height / 2 - innerHeight / 2) / innerHeight, -1, 1);
              uniforms.uPointer.value.lerp(pointerTarget, 0.1);
            },
          });
        } catch {
          return texture.dispose();
        }
        setGl(true);

        const reveal = () => gsap.to(uniforms.uReveal, { value: 1, duration: 1.8, ease: "power2.inOut" });
        let trigger: ScrollTrigger | undefined;
        const offReady = onReady(() => {
          if (killed) return;
          const r = el.getBoundingClientRect();
          if (r.top < innerHeight * 0.9 && r.left < innerWidth) reveal();
          else trigger = ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: reveal });
        });

        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          pointerTarget.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
        };
        const onEnter = () => {
          gsap.to(uniforms.uHover, { value: 1, duration: 0.6, ease: "power2.out" });
          gsap.to(uniforms.uReveal, { value: 1, duration: 0.8 });
        };
        const onLeave = () => gsap.to(uniforms.uHover, { value: 0, duration: 0.9, ease: "power2.out" });
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerenter", onEnter);
        el.addEventListener("pointerleave", onLeave);

        dispose = () => {
          offReady();
          trigger?.kill();
          gsap.killTweensOf(uniforms.uReveal);
          gsap.killTweensOf(uniforms.uHover);
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerenter", onEnter);
          el.removeEventListener("pointerleave", onLeave);
          shader.dispose();
          texture.dispose();
        };
      });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        start();
      },
      { rootMargin: "50% 50%" },
    );
    io.observe(el);

    return () => {
      killed = true;
      io.disconnect();
      dispose?.();
      setGl(false);
    };
  }, [src, focusX, focusY, edge]);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`} data-cursor={cursor}>
      <Image src={src} alt={alt} fill sizes={sizes} className={`object-cover transition-opacity duration-300 ${gl ? "opacity-0" : ""}`} style={{ objectPosition: `${focusX * 100}% ${focusY * 100}%` }} />
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
    </div>
  );
}
