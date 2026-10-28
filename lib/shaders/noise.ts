/**
 * Shared GLSL chunks. Interpolate into a shader string:
 *
 *   const frag = `${NOISE}\nvoid main() { ... noise(p) ... }`;
 */

export const NOISE = /* glsl */ `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

// smooth value noise: large regions move together, never per-pixel static
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// a signed 2D displacement at one scale, centred on zero
vec2 field(vec2 p) {
  return vec2(noise(p), noise(p + vec2(31.7, 17.3))) - 0.5;
}
`;

/** Signed distance to a rounded rect of size `size` centred at the origin. */
export const ROUNDED_RECT = /* glsl */ `
float roundedRect(vec2 p, vec2 size, float radius) {
  vec2 q = abs(p) - (size * 0.5 - radius);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}
`;
