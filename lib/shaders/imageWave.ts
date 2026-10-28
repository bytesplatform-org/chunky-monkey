import { NOISE } from "./noise";

/**
 * IMAGE WAVE — GLSL
 *
 * Draws a photo "object-fit: cover" style and lets it react:
 *
 *   uReveal    0→1 dissolves the photo in from the bottom along a noisy,
 *              neon-lit edge.
 *   uVelocity  page scroll speed (-1..1) bends the image and splits RGB.
 *   uParallax  -1..1 from the element's place in the viewport; slides the
 *              photo inside its frame.
 *   uHover     0..1 with uPointer: a ripple around the cursor and a zoom.
 *
 * Output is premultiplied (the canvas is transparent until revealed).
 */
export const imageWaveFragment = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform vec2  uImageRes;
uniform vec2  uFocus;       // crop focal point, CSS object-position style (0..1, y from the top)
uniform vec2  uResolution;
uniform float uTime;
uniform float uReveal;
uniform float uVelocity;
uniform float uParallax;
uniform float uHover;
uniform vec2  uPointer;
uniform vec3  uEdge;

varying vec2 vUv;

${NOISE}

vec2 cover(vec2 uv, float zoom) {
  vec2 ratio = uResolution / uImageRes;
  float scale = max(ratio.x, ratio.y);
  vec2 size = uImageRes * scale;
  vec2 offset = (uResolution - size) * vec2(uFocus.x, 1.0 - uFocus.y);
  uv = (uv * uResolution - offset) / size;
  return (uv - 0.5) / zoom + 0.5;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 uv = vUv;

  uv.y += sin(uv.x * 3.14159) * uVelocity * 0.06;
  uv.y += uParallax * 0.05;

  vec2 d = (uv - uPointer) * vec2(aspect, 1.0);
  float dist = length(d);
  float ripple = sin(dist * 30.0 - uTime * 5.0) * exp(-dist * 6.0) * 0.012 * uHover;
  uv += normalize(d + 1e-5) * ripple;

  vec2 tuv = cover(uv, 1.12 + 0.05 * uHover);
  float shift = 0.002 + abs(uVelocity) * 0.018 + uHover * 0.003;
  vec3 col;
  col.r = texture2D(uTexture, tuv + vec2(shift, 0.0)).r;
  col.g = texture2D(uTexture, tuv).g;
  col.b = texture2D(uTexture, tuv - vec2(shift, 0.0)).b;

  float edge = vUv.y * 0.85 + noise(vUv * vec2(5.0, 3.0) + uTime * 0.2) * 0.15;
  float r = uReveal * 1.2;
  float mask = smoothstep(edge, edge + 0.03, r);
  float band = mask * (1.0 - smoothstep(edge + 0.03, edge + 0.14, r));
  col = mix(col, uEdge, band);

  gl_FragColor = vec4(col * mask, mask);
}
`;
