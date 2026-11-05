/**
 * LIQUID IMAGE — GLSL
 *
 * A photo drawn "object-fit: cover" and dragged by a flow texture (see
 * liquidField.ts). At rest it matches the plain <img> beneath it exactly; uHover
 * pushes in far enough to keep the frame's edges covered while it flows.
 */
export const liquidImageFragment = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform sampler2D uFlow;
uniform vec2  uImageRes;
uniform vec2  uResolution;
uniform float uHover;

varying vec2 vUv;

void main() {
  vec2 ratio = uResolution / uImageRes;
  vec2 size = uImageRes * max(ratio.x, ratio.y);
  vec2 uv = vUv - texture2D(uFlow, vUv).rg;
  uv = (uv * uResolution - (uResolution - size) * 0.5) / size;
  uv = (uv - 0.5) / (1.0 + uHover * 0.08) + 0.5;
  gl_FragColor = vec4(texture2D(uTexture, uv).rgb, 1.0);
}
`;
