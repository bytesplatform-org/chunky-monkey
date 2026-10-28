import { NOISE } from "./noise";

/**
 * FLUID VIDEO TRANSITION — GLSL
 *
 * A subdivided plane carries the video from a card to a full-width panel,
 * behaving like one flexible sheet being pulled into a new shape:
 *
 *   JS       decides WHERE the sheet is — four corner positions in pixels,
 *            derived from the GSAP-tweened progress (lib/gl/sheet.ts).
 *   VERTEX   bends the sheet between those corners: broad waves, bowed edges,
 *            and a medium wobble concentrated at the boundary.
 *   FRAGMENT samples the video through displaced UVs, so the pixels stretch
 *            non-uniformly inside the sheet, and rounds the corners.
 *
 * Every deformation term is weighted by
 *
 *     uEnvelope = sin(π · uProgress)
 *
 * so at progress 0 and 1 the sheet is a clean, flat rectangle and the
 * deformation peaks mid-transition. uTime is derived from progress, never a
 * clock: when the timeline is idle, nothing in here moves.
 */

export const fluidVertexShader = /* glsl */ `
uniform vec2  uCanvas;      // canvas size, CSS px
uniform vec2  uC0;          // top-left     corner, CSS px (y down)
uniform vec2  uC1;          // top-right
uniform vec2  uC2;          // bottom-right
uniform vec2  uC3;          // bottom-left
uniform vec2  uResolution;  // the sheet's current size, CSS px
uniform float uEnvelope;    // sin(π·progress)
uniform float uTime;        // progress-derived, NOT a clock
uniform float uStrength;    // responsive / debug multiplier

varying vec2  vUv;
varying float vBend;        // how far this vertex was pushed, for debug

${NOISE}

void main() {
  vUv = uv;
  // Three's plane uv has y up; the corners are y down
  vec2 s = vec2(uv.x, 1.0 - uv.y);

  // ---- where the sheet is: bilinear between the four corners
  vec2 pos = mix(mix(uC0, uC1, s.x), mix(uC3, uC2, s.x), s.y);

  float size = min(uResolution.x, uResolution.y);
  float env  = uEnvelope * uStrength;

  // 1. broad: very low frequency, whole regions of the sheet move together
  vec2 large = field(s * 1.3 + vec2(uTime * 0.35, -uTime * 0.2)) * size * 0.16;

  // 2. edges bow in and out along their length, zero at the corners
  float bowX = sin(3.14159 * s.y) * (noise(vec2(s.x * 1.7, uTime * 0.6)) - 0.45);
  float bowY = sin(3.14159 * s.x) * (noise(vec2(s.y * 1.7 + 9.1, uTime * 0.6)) - 0.45);
  vec2 bow = vec2(bowX * uResolution.x * 0.10, bowY * uResolution.y * 0.18);

  // 3. medium: irregular movement concentrated at the boundary
  float edge = 1.0 - smoothstep(0.0, 0.22, min(min(s.x, 1.0 - s.x), min(s.y, 1.0 - s.y)));
  vec2 medium = field(s * 4.0 + uTime * 0.8) * size * 0.05 * edge;

  vec2 push = (large + bow + medium) * env;
  vBend = length(push) / max(size, 1.0);
  pos += push;

  gl_Position = vec4(pos.x / uCanvas.x * 2.0 - 1.0, 1.0 - pos.y / uCanvas.y * 2.0, 0.0, 1.0);
}
`;

export const fluidFragmentShader = /* glsl */ `
uniform sampler2D uTexture;
uniform vec2  uResolution;       // the sheet's current size, CSS px
uniform vec2  uImageResolution;  // video frame size, px
uniform float uEnvelope;
uniform float uTime;
uniform float uStrength;
uniform float uRadius;           // corner radius, CSS px
uniform float uTintAmount;       // blue wash: strong on card, clear when grown
uniform float uDebug;            // 0 normal · 1 undistorted · 2 distortion map

varying vec2  vUv;
varying float vBend;

${NOISE}

void main() {
  vec2 uv = vUv;
  float env = uDebug > 0.5 && uDebug < 1.5 ? 0.0 : uEnvelope * uStrength;

  // ---- displaced lookup: broad field, then a domain-warped medium field,
  //      then a faint fine trace so the surface is never perfectly even
  vec2 large  = field(uv * 1.6 + vec2(-uTime * 0.3, uTime * 0.25));
  vec2 medium = field(uv * 3.5 + large * 1.5 + uTime * 0.5);
  vec2 fine   = field(uv * 12.0 + uTime);
  // fades out at the border, so the border always samples the frame's edge
  vec2 border = smoothstep(0.0, 0.12, uv) * smoothstep(0.0, 0.12, 1.0 - uv);
  vec2 disp = (large * 0.045 + medium * 0.018 + fine * 0.003) * env * border;

  // ---- object-fit: cover against the sheet's current size; zoomed in a
  //      touch only while deforming, so displaced samples stay inside
  float sheetAspect = uResolution.x / max(uResolution.y, 1.0);
  float imageAspect = uImageResolution.x / max(uImageResolution.y, 1.0);
  vec2 scale = sheetAspect > imageAspect
    ? vec2(1.0, imageAspect / sheetAspect)
    : vec2(sheetAspect / imageAspect, 1.0);
  scale *= 1.0 - 0.05 * min(env, 1.0);
  vec2 tuv = clamp((uv + disp - 0.5) * scale + 0.5, 0.0, 1.0);
  // -0.5 LOD bias: at the grown size (≈1:1 with the source) trilinear
  // filtering would still blend in the next-smaller mip and soften the frame;
  // the bias keeps full-resolution sampling there, while the card — shown
  // ~2× smaller than the source — still gets enough mip to not shimmer
  vec3 color = texture2D(uTexture, tuv, -0.5).rgb;
  color = mix(color, vec3(0.18, 0.24, 1.0), uTintAmount);

  // ---- rounded corners, antialiased to one pixel
  vec2 p = (uv - 0.5) * uResolution;
  vec2 q = abs(p) - (uResolution * 0.5 - uRadius);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float alpha = clamp(0.5 - d / max(fwidth(d), 1e-3), 0.0, 1.0);
  if (alpha <= 0.0) discard;

  if (uDebug > 1.5) {
    // distortion map: red = sheet bend, green = pixel displacement
    color = mix(color * 0.35, vec3(vBend * 6.0, length(disp) * 25.0, 0.15), 0.8);
  }

  gl_FragColor = vec4(color, alpha);
}
`;
