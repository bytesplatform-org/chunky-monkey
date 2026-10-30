/**
 * The drone tour: a closed loop of camera stops (where it is, what it looks
 * at). It starts and ends on the same high three-quarter shot, so the scroll
 * can wrap from the bottom of the page to the top without a cut. Stops are
 * evenly spaced along the loop, so more stops in a stretch means it plays
 * slower there.
 */

import * as THREE from "three";

type Stop = [position: [number, number, number], look: [number, number, number]];

const OCTOPUS: [number, number, number] = [-7.4, 1.8, 12.8];
const FERRIS: [number, number, number] = [8.25, 6.6, -14.3];

const STOPS: Stop[] = [
  [[34, 28, 40], [0, 2, 0]], //  0 hero
  [[2, 13, 52], [0, 5, 24]], //  1 in towards the gate
  [[0, 10.5, 29], [0, 3, 16]], //  2 over the gate
  [[0, 3.4, 19.5], [0, 2.4, 10]], //  3 down the boulevard
  [[-0.6, 3.6, 13.8], OCTOPUS], //  4 turn for the octopus
  [[1.8, 6.2, 20.5], OCTOPUS], //  5 orbit, 12 m out
  [[-9.5, 6.6, 24.6], OCTOPUS], //  6
  [[-19.2, 6.8, 14.9], OCTOPUS], //  7
  [[-18.7, 7.2, 8.7], OCTOPUS], //  8
  [[-18, 13, 9.5], [-14.5, 3.5, 0]], //  9 rise over the big top
  [[-22, 14, -2], [-14.5, 3.5, -1]], // 10
  [[-17.6, 7.4, -8.4], [-12, 4.2, -9]], // 11 along the coaster
  [[-11.2, 6.8, -7.4], [-5.5, 3.4, -11]], // 12
  [[-5.4, 6.4, -9.6], [-1, 3, -15.5]], // 13
  [[-1.2, 6.4, -14], [-0.6, 4.2, -20.5]], // 14
  [[1.8, 7.5, -21.5], FERRIS], // 15 around the wheel
  [[8.5, 9.5, -29], FERRIS], // 16
  [[21, 10, -19], FERRIS], // 17
  [[19.5, 9, -4.5], FERRIS], // 18
  [[6.5, 10, -1.5], FERRIS], // 19
  [[22, 20, 18], [2, 2, 2]], // 20 up to the hero shot
];

const vec = (p: [number, number, number]) => new THREE.Vector3(...p);

export const positionCurve = new THREE.CatmullRomCurve3(STOPS.map(s => vec(s[0])), true, "centripetal");
export const lookCurve = new THREE.CatmullRomCurve3(STOPS.map(s => vec(s[1])), true, "centripetal");

/** Loop position (0–1) of stop `i`; the curves pass every stop at evenly spaced parameters. */
const at = (i: number) => i / STOPS.length;

export type Caption = { title: string; line: string; from: number; to: number };

export const CAPTIONS: Caption[] = [
  { title: "The Gate", line: "In under the arch and down the boulevard.", from: at(1.5), to: at(3.6) },
  { title: "The Octopus", line: "Eight arms that lift, drop and spin.", from: at(4.5), to: at(8.4) },
  { title: "The Big Top", line: "Shows under the stripes.", from: at(8.6), to: at(10.6) },
  { title: "Roller Coaster", line: "Seventy metres of track and one loop.", from: at(11), to: at(14.2) },
  { title: "Ferris Wheel", line: "Fourteen gondolas over the whole park.", from: at(14.6), to: at(19.4) },
];

/** index into CAPTIONS for loop position `u`, or -1 between rides */
export const captionAt = (u: number) => CAPTIONS.findIndex(c => u >= c.from && u <= c.to);

/** Rides you can point at, by node name. */
export const RIDES: Record<string, string> = {
  Ferris_Wheel: "Ferris Wheel",
  Carousel: "Carousel",
  Octopus_Ride: "The Octopus",
  SwingRide: "Swing Ride",
  RollerCoaster: "Roller Coaster",
  BalloonTower: "Balloon Tower",
  BigTop: "The Big Top",
};
