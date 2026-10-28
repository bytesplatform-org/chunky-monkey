/**
 * CARNIVAL BULBS — GLSL
 *
 * Every light in the scene is a point sprite: a hot core plus a soft halo,
 * blended additively, so a few hundred of them read as glow without a bloom
 * pass. Each bulb carries a phase along its strip; a chase runs through the
 * phases so the lights march the way fairground lights do.
 */

export const bulbVertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uChase;       // chase speed (0 = steady)
attribute vec3 aColor;
attribute float aPhase;
varying vec3 vColor;
varying float vOn;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float wave = 0.5 + 0.5 * sin(aPhase * 6.28318 * 3.0 - uTime * uChase);
  vOn = 0.35 + 0.65 * smoothstep(0.25, 0.85, wave);
  vColor = aColor;
  gl_PointSize = uSize * uPixelRatio * (620.0 / -mv.z) * (0.75 + 0.25 * vOn);
}
`;

export const bulbFragment = /* glsl */ `
varying vec3 vColor;
varying float vOn;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float core = smoothstep(0.18, 0.0, d) * 1.4;
  float halo = exp(-d * d * 4.0) * 0.8;
  vec3 col = mix(vColor, vec3(1.0, 0.97, 0.9), core * 0.7) * (core + halo) * vOn;
  gl_FragColor = vec4(col, 1.0);
}
`;
