import * as THREE from "three";
import gsap from "gsap";
import { FULLSCREEN_VERTEX } from "@/lib/shaders/noise";

type Uniforms = Record<string, THREE.IUniform>;

type Options = {
  fragmentShader: string;
  uniforms?: Uniforms;
  /** advance uTime with the clock (false under reduced motion) */
  animate?: boolean;
  /** transparent canvas, for shaders that output alpha */
  transparent?: boolean;
  /** called every rendered frame, before drawing */
  onFrame?: (time: number, deltaMs: number) => void;
};

/**
 * A full-canvas fragment shader. Manages uTime and uResolution (drawing
 * buffer px), sizes with the canvas, and only renders while on screen.
 * Renders on GSAP's ticker so it shares one clock with Lenis/ScrollTrigger.
 * Throws if WebGL is unavailable; callers fall back to CSS.
 */
export function createShaderCanvas(canvas: HTMLCanvasElement, opts: Options) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: !!opts.transparent,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  if (opts.transparent) renderer.setClearColor(0x000000, 0);

  const uniforms: Uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    ...opts.uniforms,
  };

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new THREE.ShaderMaterial({
    vertexShader: FULLSCREEN_VERTEX,
    fragmentShader: opts.fragmentShader,
    uniforms,
    transparent: !!opts.transparent,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  const render = () => renderer.render(scene, camera);

  const resize = () => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.getDrawingBufferSize(uniforms.uResolution.value);
    render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let visible = true;
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  io.observe(canvas);

  const tick = (time: number, deltaMs: number) => {
    if (!visible) return;
    if (opts.animate !== false) uniforms.uTime.value = time;
    opts.onFrame?.(time, deltaMs);
    render();
  };
  gsap.ticker.add(tick);

  return {
    uniforms,
    renderer,
    dispose() {
      gsap.ticker.remove(tick);
      ro.disconnect();
      io.disconnect();
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
