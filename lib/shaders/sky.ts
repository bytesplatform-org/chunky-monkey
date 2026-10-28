import { NOISE } from "./noise";

/**
 * NIGHT SKY — GLSL
 *
 * The backdrop behind the carnival, drawn as a full-screen pass:
 *
 *   uProgress  0 → 1 carries the sky from dusk (orange-pink horizon, violet
 *              top) into full night; stars and fireworks come up with it.
 *   uPointer   -1..1, nudges the sky a touch for parallax.
 *
 * Fireworks are procedural: a few slots, each bursting on its own cycle at a
 * hashed spot, with sparks that fly out, fall, and fade.
 */
export const skyFragment = /* glsl */ `
uniform float uTime;
uniform vec2  uResolution;
uniform float uProgress;
uniform vec2  uPointer;
uniform float uFireworks;   // 0 off · 1 on (skipped on low-power screens)
varying vec2  vUv;

${NOISE}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.0);
    a *= 0.5;
  }
  return v;
}

vec3 palette(float h) {
  vec3 c = vec3(1.0, 0.79, 0.24);                // yellow
  c = mix(c, vec3(0.94, 0.23, 0.22), step(0.2, h)); // red
  c = mix(c, vec3(0.30, 0.76, 0.35), step(0.4, h)); // green
  c = mix(c, vec3(0.35, 0.50, 1.0),  step(0.6, h)); // blue
  c = mix(c, vec3(1.0, 0.31, 0.64),  step(0.8, h)); // pink
  return c;
}

vec3 firework(vec2 p, float slot) {
  float period = 3.4 + slot * 0.7;
  float t = uTime + slot * 1.37;
  float cycle = floor(t / period);
  float local = fract(t / period) * period;
  vec2 seed = vec2(cycle, slot * 13.1);
  float aspect = uResolution.x / uResolution.y;
  vec2 centre = vec2((hash(seed) - 0.5) * aspect * 0.8, 0.12 + hash(seed + 3.7) * 0.3);
  vec3 tint = palette(hash(seed + 9.2));

  float life = 1.6;
  if (local > life) return vec3(0.0);
  float k = local / life;
  float radius = (1.0 - pow(1.0 - min(k * 1.4, 1.0), 3.0)) * (0.16 + hash(seed + 1.1) * 0.1);
  float fade = pow(1.0 - k, 1.6);

  vec3 col = vec3(0.0);
  const int SPARKS = 22;
  for (int i = 0; i < SPARKS; i++) {
    float a = float(i) / float(SPARKS) * 6.28318 + hash(seed + float(i)) * 0.2;
    vec2 dir = vec2(cos(a), sin(a));
    vec2 s = centre + dir * radius - vec2(0.0, k * k * 0.08);
    float d = length(p - s);
    col += tint * (0.0009 / (d * d + 0.00025)) * 0.012;
    // a short trail behind each spark
    vec2 s2 = centre + dir * radius * 0.82 - vec2(0.0, k * k * 0.06);
    float d2 = length(p - s2);
    col += tint * (0.0004 / (d2 * d2 + 0.0004)) * 0.006;
  }
  // the flash at the moment of the burst
  col += tint * exp(-length(p - centre) * 18.0) * smoothstep(0.12, 0.0, k) * 1.4;
  return col * fade;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) + uPointer * 0.015;
  float night = smoothstep(0.0, 1.0, uProgress);

  // ---- gradient: horizon glow low, deep violet / ink up top
  vec3 top     = mix(vec3(0.16, 0.10, 0.40), vec3(0.025, 0.02, 0.08), night);
  vec3 mid     = mix(vec3(0.55, 0.22, 0.55), vec3(0.10, 0.05, 0.22), night);
  vec3 horizon = mix(vec3(1.0, 0.50, 0.34), vec3(0.36, 0.12, 0.40), night);
  float h = uv.y;
  vec3 col = mix(horizon, mid, smoothstep(0.18, 0.5, h));
  col = mix(col, top, smoothstep(0.45, 1.0, h));

  // ---- clouds: a soft band above the horizon, lit from below
  float c = fbm(vec2(p.x * 1.6 + uTime * 0.012, p.y * 4.0));
  float band = smoothstep(0.1, 0.45, h) * (1.0 - smoothstep(0.45, 0.8, h));
  vec3 cloudLit = mix(vec3(1.0, 0.55, 0.5), vec3(0.32, 0.16, 0.45), night);
  col = mix(col, cloudLit, smoothstep(0.5, 0.8, c) * band * 0.45);

  // ---- stars, fading in with the night
  vec2 g = uv * vec2(aspect, 1.0) * 140.0;
  vec2 cell = floor(g);
  float rnd = hash(cell);
  vec2 offs = vec2(hash(cell + 1.3), hash(cell + 7.1)) - 0.5;
  float star = smoothstep(0.08, 0.0, length(fract(g) - 0.5 - offs * 0.6));
  float twinkle = 0.55 + 0.45 * sin(uTime * (1.5 + rnd * 3.0) + rnd * 40.0);
  col += vec3(1.0, 0.95, 0.85) * star * step(0.965, rnd) * twinkle * smoothstep(0.3, 0.7, h) * (0.25 + night);

  // ---- fireworks, once it's dark enough
  if (uFireworks > 0.5) {
    vec2 fp = (uv - vec2(0.5, 0.5)) * vec2(aspect, 1.0);
    vec3 fw = firework(fp, 0.0) + firework(fp, 1.0) + firework(fp, 2.0);
    col += fw * smoothstep(0.15, 0.6, night + 0.2);
  }

  // ---- a little grain so the gradient never bands
  col += (hash(uv * uResolution + fract(uTime)) - 0.5) * 0.02;

  gl_FragColor = vec4(col, 1.0);
}
`;

/** The sky's horizon colour at a given progress, for matching fog in the 3D scene. */
export function horizonColor(progress: number, out: { setRGB(r: number, g: number, b: number): unknown }) {
  const t = progress * progress * (3 - 2 * progress);
  out.setRGB(
    (0.55 + (0.10 - 0.55) * t) * 0.55,
    (0.22 + (0.05 - 0.22) * t) * 0.55,
    (0.55 + (0.22 - 0.55) * t) * 0.55,
  );
}
