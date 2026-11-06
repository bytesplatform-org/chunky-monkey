/**
 * The drone tour as it runs on the home page. It starts and ends on the top
 * view the hero's walk comes to rest on, and between the two follows the /park
 * tour's stops, carried across to where the park sits on this page. The section
 * that scrubs it sets `parkTour`; the stage pass reads it.
 */

import * as THREE from "three";
import { CAPTIONS, PARK_STOPS, STOP_COUNT, captionAt, smoother, tourStops } from "@/components/park/tour";
import { TOP_VIEW } from "./arcadePath";
import type { ParkExplore } from "./parkExplore";

/** `active` and `target` are written by the section and read by the pass; the pass offers `explorer` for pointing at the rides. */
export const parkTour = { active: false, target: 0, explorer: null as ParkExplore | null };

/** Where the camera passes on its way down from the top view to the gate, and back up from the swing ride, in the park's own space. */
const DESCENT = new THREE.Vector3(0, 28, 40);
const ASCENT = new THREE.Vector3(26, 26, 32);

/** Stops spent on the way down and back up: about the /park stops' spacing, so the speed holds. */
const LEAD = 14;
const TAIL = 12;

/** `count` points evenly along a curve through `through`, between its knots `from` and `to`, at fractions `t(i)` of the way. */
function along(through: THREE.Vector3[], from: number, to: number, count: number, t: (i: number) => number) {
  const curve = new THREE.CatmullRomCurve3(through, false, "centripetal");
  const lengths = curve.getLengths(1000);
  const reach = (knot: number) => lengths[Math.round((knot / (through.length - 1)) * 1000)] / lengths[1000];
  return Array.from({ length: count }, (_, i) => curve.getPointAt(THREE.MathUtils.lerp(reach(from), reach(to), t(i))));
}

export function buildParkTour(scene: THREE.Object3D, land: THREE.Matrix4) {
  const placed = tourStops(scene)
    .slice(PARK_STOPS.from, PARK_STOPS.to + 1)
    .map(([position, look]) => [position.clone().applyMatrix4(land), look.clone().applyMatrix4(land)]);
  const [first, second] = placed;
  const last = placed[placed.length - 1];
  const before = placed[placed.length - 2];
  const top = [TOP_VIEW.position, TOP_VIEW.look];

  const start = (i: number) => i / LEAD;
  const end = (i: number) => (i + 1) / TAIL;
  const down = along([top[0], DESCENT.clone().applyMatrix4(land), first[0], second[0]], 0, 2, LEAD, start);
  const up = along([before[0], last[0], ASCENT.clone().applyMatrix4(land), top[0]], 1, 3, TAIL, end);

  const stops = [
    ...down.map((position, i) => [position, top[1].clone().lerp(first[1], smoother(start(i)))]),
    ...placed,
    ...up.map((position, i) => [position, last[1].clone().lerp(top[1], smoother(end(i)))]),
  ];
  const positions = new THREE.CatmullRomCurve3(stops.map(s => s[0]), false, "centripetal");
  const looks = new THREE.CatmullRomCurve3(stops.map(s => s[1]), false, "centripetal");
  const look = new THREE.Vector3();
  return {
    /** Places the camera at tour progress p, and returns where it's looking. */
    place(camera: THREE.Camera, p: number) {
      positions.getPoint(p, camera.position);
      camera.lookAt(looks.getPoint(p, look));
      return look;
    },
  };
}

/** Curve points in the whole path: the way down, the /park stops used, and the way back up. */
const POINTS = LEAD + (PARK_STOPS.to - PARK_STOPS.from + 1) + TAIL;

/** Tour progress at curve point `i`. */
const atPoint = (i: number) => i / (POINTS - 1);

/** How far the lens has gone from the walk's wide one to /park's long one, 0..1. */
export const lensAt = (p: number) =>
  THREE.MathUtils.smoothstep(p, 0, atPoint(LEAD)) * (1 - THREE.MathUtils.smoothstep(p, atPoint(POINTS - 1 - TAIL), 1));

/** The /park caption showing at tour progress p, or null. */
export function captionFor(p: number) {
  const stop = p * (POINTS - 1) - LEAD + PARK_STOPS.from;
  const i = captionAt(stop / STOP_COUNT);
  return i >= 0 ? CAPTIONS[i] : null;
}

/** True for the opening stretch, before the first ride's caption. */
export const isOpening = (p: number) => p < atPoint(LEAD) * 0.9;
