/**
 * The drone tour: a closed loop of camera stops (where it is, what it looks
 * at). It starts and ends on the same high three-quarter shot, so the scroll
 * can wrap from the bottom of the page to the top without a cut. Stops are
 * evenly spaced along the loop, so more stops in a stretch means it plays
 * slower there.
 */

import * as THREE from "three";

type Stop = [position: THREE.Vector3, look: THREE.Vector3];

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** where a node sits in the world, or `fallback` if the model hasn't got it */
const anchor = (scene: THREE.Object3D, name: string, fallback: THREE.Vector3) => {
  const node = scene.getObjectByName(name);
  return node ? node.getWorldPosition(new THREE.Vector3()).setY(0) : fallback;
};

/**
 * The stops. The octopus orbit, the drop tower and bumper car shots are offsets from
 * those rides as they sit in the loaded model, so they follow the rides
 * when the model moves them.
 */
function stops(scene: THREE.Object3D): Stop[] {
  scene.updateMatrixWorld(true);
  const octopus = anchor(scene, "Octopus_Ride", v(-9, 0, 14));
  const tower = anchor(scene, "BalloonTower", v(-14.5, 0, 0));
  const ferris = anchor(scene, "Ferris_Wheel", v(8.25, 0, -14.3));
  const bumper = anchor(scene, "BumperCars", v(14, 0, 0));
  const octo = (x: number, y: number, z: number) => octopus.clone().add(v(x, y, z));
  const near = (x: number, y: number, z: number) => tower.clone().add(v(x, y, z));
  const pad = (x: number, y: number, z: number) => bumper.clone().add(v(x, y, z));
  const OCTOPUS = octo(0, 1.8, 0);
  const TOWER = near(0, 7, 0);
  const FERRIS = ferris.clone().setY(6.6);
  const BUMPER = pad(0, 0.7, 0);

  return [
    [v(34, 28, 40), v(0, 2, 0)], //  0 hero
    [v(2, 13, 52), v(0, 5, 24)], //  1 in towards the gate
    [v(0, 10.5, 29), v(0, 3, 16)], //  2 over the gate
    [v(0, 3.4, 19.5), v(0, 2.4, 10)], //  3 down the boulevard
    [v(-0.6, 3.6, 13.8), OCTOPUS], //  4 turn for the octopus
    [octo(9.2, 6.2, 7.7), OCTOPUS], //  5 orbit, 12 m out
    [octo(-2.1, 6.6, 11.8), OCTOPUS], //  6
    [octo(-11.8, 6.8, 2.1), OCTOPUS], //  7
    [octo(-11.3, 7.2, -4.1), OCTOPUS], //  8
    [near(-3.5, 13, 9.5), TOWER], //  9 rise past the drop tower
    [near(-11, 12, -3), near(0, 6.5, -1)], // 10
    [v(-17.6, 7.4, -8.4), v(-12, 4.2, -9)], // 11 along the coaster
    [v(-11.2, 6.8, -7.4), v(-5.5, 3.4, -11)], // 12
    [v(-5.4, 6.4, -9.6), v(-1, 3, -15.5)], // 13
    [v(-1.2, 6.4, -14), v(-0.6, 4.2, -20.5)], // 14
    [v(1.8, 7.5, -21.5), FERRIS], // 15 around the wheel
    [v(8.5, 9.5, -29), FERRIS], // 16
    [v(21, 10, -19), FERRIS], // 17
    [v(19.5, 9, -4.5), FERRIS], // 18
    [v(6.5, 10, -1.5), FERRIS], // 19
    [pad(-4.5, 3, 8.5), BUMPER], // 20 down to the bumper cars, low enough to see under the roof
    [pad(0, 2.9, 10), BUMPER], // 21
    [pad(5, 7, 9.5), BUMPER], // 22 up over the trees
    [v(22, 20, 18), v(2, 2, 2)], // 23 up to the hero shot
  ];
}

/** stop count, fixed: the captions are placed by stop index */
const STOP_COUNT = 24;

/** The stops themselves, placed on the loaded scene, for a tour built on them elsewhere. */
export const tourStops = stops;

export type Tour = { positionCurve: THREE.CatmullRomCurve3; lookCurve: THREE.CatmullRomCurve3 };

/** The tour's position and look curves, through the stops placed on the loaded scene. */
export function buildTour(scene: THREE.Object3D): Tour {
  const s = stops(scene);
  return {
    positionCurve: new THREE.CatmullRomCurve3(s.map(p => p[0]), true, "centripetal"),
    lookCurve: new THREE.CatmullRomCurve3(s.map(p => p[1]), true, "centripetal"),
  };
}

/** Loop position (0–1) of stop `i`; the curves pass every stop at evenly spaced parameters. */
const at = (i: number) => i / STOP_COUNT;

export type Caption = { title: string; line: string; from: number; to: number };

export const CAPTIONS: Caption[] = [
  { title: "The Gate", line: "In under the arch and down the boulevard.", from: at(1.5), to: at(3.6) },
  { title: "The Octopus", line: "Eight arms spinning round the hub.", from: at(4.5), to: at(8.4) },
  { title: "Drop Tower", line: "A slow climb, then the drop.", from: at(8.6), to: at(10.6) },
  { title: "Roller Coaster", line: "Seventy metres of track and one loop.", from: at(11), to: at(14.2) },
  { title: "Ferris Wheel", line: "Fourteen gondolas over the whole park.", from: at(14.6), to: at(19.2) },
  { title: "Bumper Cars", line: "Eight cars, one small floor.", from: at(19.8), to: at(21.8) },
];

/** index into CAPTIONS for loop position `u`, or -1 between rides */
export const captionAt = (u: number) => CAPTIONS.findIndex(c => u >= c.from && u <= c.to);

/** Rides you can point at, by root node name. */
export const RIDES: Record<string, string> = {
  Octopus_Ride: "Octopus",
  RollerCoaster: "Roller Coaster",
  Ferris_Wheel: "Ferris Wheel",
  BalloonTower: "Drop Tower",
  BumperCars: "Bumper Cars",
  SwingRide: "Swing Ride",
};
