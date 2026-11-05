/**
 * The hero's walk, driven by scroll progress p (0..1). The camera follows a
 * curve through the stops; its gaze follows a second curve keyed to the same
 * stops. Speed is set by distance, so a stretch of scroll covers the same
 * ground anywhere indoors, while the big move outside goes quicker per metre.
 *
 * In from the corridor, a look round the lobby, down the machine aisle with a
 * glance at the bumper cars through the gap in the row, out of the exit door
 * onto the road to the park's gate, and a crane up to look down on the park.
 */

import * as THREE from "three";

type Stop = [position: [number, number, number], look: [number, number, number]];

/** The middle of the park, outside (see parkOutside.ts). */
export const PARK_CENTRE = new THREE.Vector3(78, 0, -3.75);

const DOOR_Z = PARK_CENTRE.z;

const STOPS: Stop[] = [
  [[9.5, 1.65, 5], [9.5, 1.6, -5]], // in the corridor
  [[9.5, 1.6, 1.5], [9, 1.5, -6]],
  [[8.4, 1.6, -2], [4.5, 1.4, -8.5]], // the lobby, to the left
  [[8.3, 1.6, -3.3], [3, 1.4, -4.5]],
  [[10.6, 1.6, -3.4], [8.6, 1.3, -10.5]], // round past the air hockey
  [[13.5, 1.6, -3.5], [22, 1.4, -3.5]], // into the aisle
  [[18.5, 1.6, -3.6], [27, 1.4, -3.2]],
  [[20.8, 1.6, -3.5], [21.4, 1.2, -11]], // the bumper cars, through the gap
  [[22.2, 1.6, -3.5], [21.9, 1.2, -11]],
  [[25.5, 1.65, -3.65], [40, 1.5, DOOR_Z]], // on towards the door
  [[33, 1.65, DOOR_Z], [54, 2.2, DOOR_Z]], // out of it
  [[40, 1.9, DOOR_Z], [56, 3, DOOR_Z]], // down the steps, the gate ahead
  [[47, 5, DOOR_Z], [70, 2, DOOR_Z]], // lifting
  [[56, 20, DOOR_Z], [PARK_CENTRE.x - 2, 0, DOOR_Z]],
  [[65, 45, DOOR_Z], [PARK_CENTRE.x - 3, 0, DOOR_Z]], // the park from above, high in the frame for the words below it
];

/** Where the walk comes to rest: the park from above. The home page's drone tour starts and ends here. */
export const TOP_VIEW = {
  position: new THREE.Vector3(...STOPS[STOPS.length - 1][0]),
  look: new THREE.Vector3(...STOPS[STOPS.length - 1][1]),
};

/** Stops a caption or a beat hangs on. */
export const STOP = { lobby: 2, aisle: 5, bumperCars: 7, onward: 8.4, door: 10 };

const vec = (p: [number, number, number]) => new THREE.Vector3(...p);

const positions = new THREE.CatmullRomCurve3(STOPS.map(s => vec(s[0])), false, "centripetal");
const looks = new THREE.CatmullRomCurve3(STOPS.map(s => vec(s[1])), false, "centripetal");

/** Share of the scroll spent easing up to speed at the start, and the point where the glide to rest begins. */
const EASE_IN = 0.04;
const EASE_OUT_FROM = 0.8;

/**
 * Scroll progress → distance along the path (0..1), with continuous speed:
 * accelerate gently from rest, cruise, then glide to rest exactly at the last
 * stop. No kinks, so no jerks.
 */
function travel(p: number) {
  p = Math.min(1, Math.max(0, p));
  const a = EASE_IN;
  const b = EASE_OUT_FROM;
  const v = 1 / (a / 2 + (b - a) + (1 - b) / 2); // cruise speed, so the total is 1
  if (p < a) return (v * p * p) / (2 * a);
  if (p < b) return v * (a / 2 + (p - a));
  const q = p - b;
  return v * (a / 2 + (b - a) + q - (q * q) / (2 * (1 - b)));
}

/** Outdoors, a metre costs this share of the scroll it does indoors. */
const OUTDOOR_COST = 0.42;

/** t along the curves against the scroll each sample has used up, 0..1. */
const SAMPLES = 800;
const cost = new Float32Array(SAMPLES + 1);
{
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  positions.getPoint(0, a);
  for (let i = 1; i <= SAMPLES; i++) {
    positions.getPoint(i / SAMPLES, b);
    // eases from indoor pace to outdoor pace past the door, so the speed never steps
    const out = THREE.MathUtils.smoothstep(b.x, 30, 44);
    cost[i] = cost[i - 1] + a.distanceTo(b) * THREE.MathUtils.lerp(1, OUTDOOR_COST, out);
    a.copy(b);
  }
  for (let i = 1; i <= SAMPLES; i++) cost[i] /= cost[SAMPLES];
}

/** scroll used up → t */
function tAt(u: number) {
  let lo = 0, hi = SAMPLES;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cost[mid] <= u) lo = mid;
    else hi = mid;
  }
  return (lo + (u - cost[lo]) / Math.max(cost[hi] - cost[lo], 1e-6)) / SAMPLES;
}

/** The inverse of travel, so the page can place a beat at a stop. */
function progressOf(u: number) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (travel(mid) < u) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Progress p at which the camera reaches stop `index` (fractions of a stop are fine). */
export function progressAtStop(index: number) {
  const f = (index / (STOPS.length - 1)) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(f));
  return progressOf(cost[i] + (cost[i + 1] - cost[i]) * (f - i));
}

const look = new THREE.Vector3();

/** Puts the camera where progress p says, looking where the stops say. */
export function placeCamera(camera: THREE.Camera, p: number) {
  const t = tAt(travel(p));
  positions.getPoint(t, camera.position);
  camera.lookAt(looks.getPoint(t, look));
}

/** Past here the camera only looks away from the arcade, so it needn't be drawn. */
export const LEFT_ARCADE_X = 40;
/** Short of here the door isn't in view from the walk, so the park needn't be drawn. */
export const DOOR_IN_VIEW_X = 11;
