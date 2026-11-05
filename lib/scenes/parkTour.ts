/**
 * The drone tour as it runs on the home page. It starts and ends on the top
 * view the hero's walk comes to rest on, and between the two follows the /park
 * tour's stops, carried across to where the park sits on this page. The section
 * that scrubs it sets `parkTour`; the stage pass reads it.
 */

import * as THREE from "three";
import { CAPTIONS, STOP_COUNT, captionAt, tourStops } from "@/components/park/tour";
import { TOP_VIEW } from "./arcadePath";
import type { ParkExplore } from "./parkExplore";

/** `active` and `target` are written by the section and read by the pass; the pass offers `explorer` for pointing at the rides. */
export const parkTour = { active: false, target: 0, explorer: null as ParkExplore | null };

/** The camera's way down from the top view to the /park tour's approach to the gate, in the park's own space. */
const DESCENT: [position: THREE.Vector3, look: THREE.Vector3] = [new THREE.Vector3(1, 30, 40), new THREE.Vector3(0, 4, 14)];

/** The /park tour's stops this one uses: from the approach to the gate (its stop 0 is its own top shot) to the last. */
const FROM_STOP = 1;

/** Stops before the first /park stop: the top view and the descent. Curve points are evenly spaced, as on /park. */
const LEAD = 2;

export function buildParkTour(scene: THREE.Object3D, land: THREE.Matrix4) {
  const placed = tourStops(scene).slice(FROM_STOP).map(([position, look]) => [position.clone().applyMatrix4(land), look.clone().applyMatrix4(land)]);
  const descent = DESCENT.map(v => v.clone().applyMatrix4(land));
  const top = [TOP_VIEW.position, TOP_VIEW.look];
  const stops = [top, descent, ...placed, top];
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

/** Curve points in the whole path: the lead, the /park stops used, and the top view again. */
const POINTS = LEAD + (STOP_COUNT - FROM_STOP) + 1;

/** Tour progress at curve point `i`. */
const atPoint = (i: number) => i / (POINTS - 1);

/** How far the lens has gone from the walk's wide one to /park's long one, 0..1. */
export const lensAt = (p: number) =>
  THREE.MathUtils.smoothstep(p, 0, atPoint(LEAD)) * (1 - THREE.MathUtils.smoothstep(p, atPoint(POINTS - 3), 1));

/** The /park caption showing at tour progress p, or null. */
export function captionFor(p: number) {
  const stop = p * (POINTS - 1) - LEAD + FROM_STOP;
  const i = captionAt(stop / STOP_COUNT);
  return i >= 0 ? CAPTIONS[i] : null;
}

/** True for the opening stretch, before the first ride's caption. */
export const isOpening = (p: number) => p < atPoint(LEAD) * 0.9;
