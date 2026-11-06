/**
 * The drone tour: a closed loop that starts and ends on the same high
 * three-quarter shot, so the scroll can wrap from the bottom of the page to the
 * top without a cut. The route is drawn as real arcs around the rides, joined by
 * sweeping turns, then cut into evenly spaced stops: the camera holds one speed
 * all the way round, and its look eases from ride to ride.
 */

import * as THREE from "three";

type Stop = [position: THREE.Vector3, look: THREE.Vector3];

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** where a node sits in the world, or `fallback` if the model hasn't got it */
const anchor = (scene: THREE.Object3D | null, name: string, fallback: THREE.Vector3) => {
  const node = scene?.getObjectByName(name);
  return node ? node.getWorldPosition(new THREE.Vector3()).setY(0) : fallback;
};

/** A point the route passes. With a look the camera is on that look there; without one it's still turning to the next. */
type Key = { at: THREE.Vector3; look?: THREE.Vector3 };

/** One stretch of the route, named for the caption that goes with it. */
type Leg = { name: string; keys: Key[] };

const fly = (x: number, y: number, z: number): Key => ({ at: v(x, y, z) });

/** Degrees between keys on an arc. */
const ARC_STEP = 15;

/**
 * An arc around `centre`. Angle 0 is +z (towards the gate) and 90 is +x; radius
 * and height ease from their first value to their second, so an orbit can spiral.
 * The look goes from `look` to `lookEnd`. The camera is still turning onto the
 * ride for the first `turn` keys.
 */
function arc(centre: THREE.Vector3, from: number, to: number, radius: [number, number], height: [number, number], look: THREE.Vector3, { lookEnd = look, turn = 0 }: { lookEnd?: THREE.Vector3; turn?: number } = {}): Key[] {
  const { lerp, degToRad } = THREE.MathUtils;
  const count = Math.max(2, Math.round(Math.abs(to - from) / ARC_STEP));
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count;
    const angle = degToRad(lerp(from, to, t));
    const r = lerp(radius[0], radius[1], t);
    return {
      at: v(centre.x + r * Math.sin(angle), lerp(height[0], height[1], t), centre.z + r * Math.cos(angle)),
      look: i < turn ? undefined : look.clone().lerp(lookEnd, t),
    };
  });
}

/**
 * The route, once round the plaza, passing each ride on its far side so the rest
 * of the park stands behind it. The gate's clear opening is x within 3.05 and y
 * from 1.03 (the turnstiles) to 4.56 (the sign), so the camera goes through at 3,
 * then climbs clear of the boulevard's bunting and lamps.
 */
function legs(scene: THREE.Object3D | null): Leg[] {
  const octopus = anchor(scene, "Octopus_Ride", v(-9, 0, 14));
  const tower = anchor(scene, "BalloonTower", v(-14.14, 0, 0));
  const coaster = anchor(scene, "RollerCoaster", v(-9, 0, -15));
  const ship = anchor(scene, "PirateShip", v(8.25, 0, -14.3));
  const bumper = anchor(scene, "BumperCars", v(13.62, 0, 0));
  const swings = anchor(scene, "SwingRide", v(10.3, 0, 17.84));
  const OCTOPUS = octopus.clone().setY(3);
  const COASTER = coaster.clone().setY(3.5);
  const SHIP = ship.clone().setY(4.5);
  const BUMPER = bumper.clone().setY(0.9);
  const SWINGS = swings.clone().setY(4);

  return [
    { name: "hero", keys: [{ at: v(34, 28, 40), look: v(0, 2, 0) }, fly(25, 24, 54), fly(9, 14.5, 60)] },
    {
      name: "gate",
      keys: [
        { at: v(0, 7.5, 50), look: v(0, 4, 24) },
        { at: v(0, 4.2, 38), look: v(0, 3.4, 24) },
        { at: v(0, 3, 30), look: v(0, 3, 16) },
        { at: v(0, 3, 24), look: v(0, 3.2, 4) }, // through the gate
        fly(0, 3.6, 20.5), // already easing round to the octopus
      ],
    },
    // once right round the octopus and on, spiralling up and out; tighter on the plaza side, to miss the tower
    { name: "octopus", keys: [...arc(octopus, 90, 450, [9.5, 13.5], [4.8, 9.5], OCTOPUS, { turn: 7 }), ...arc(octopus, 465, 495, [13, 12], [9.5, 9], OCTOPUS)] },
    // climbing, the look rising up the tower
    { name: "tower", keys: [fly(-1.4, 9, -1), ...arc(tower, 125, 190, [13.5, 14.5], [9.5, 16], tower.clone().setY(7), { lookEnd: tower.clone().setY(13), turn: 1 })] },
    { name: "coaster", keys: [fly(-23, 15.5, -12.8), fly(-27.6, 15, -16.6), ...arc(coaster, -110, -200, [18, 18], [14, 11], COASTER, { turn: 2 })] },
    { name: "ship", keys: [fly(2.2, 10.6, -30.6), ...arc(ship, -165, -285, [14, 14], [10, 8.5], SHIP, { turn: 2 })] },
    // low, to see in under the roof
    { name: "bumper", keys: [fly(23.3, 7.5, -5.6), ...arc(bumper, 105, 10, [11, 11], [5.2, 4.4], BUMPER, { turn: 2 })] },
    // over the boulevard and round the front of the swings, high enough to clear the gate
    { name: "swings", keys: [fly(9.5, 5.4, 9.2), fly(4.6, 7, 7.6), ...arc(swings, 225, 400, [14, 14], [8.5, 11], SWINGS, { turn: 3 })] },
    { name: "back", keys: [fly(26.5, 13.5, 29), fly(32, 20.5, 33)] },
  ];
}

/** Stops in the loop, fixed: the home page counts in them. */
export const STOP_COUNT = 120;

const SAMPLES = 4000;

/** Eases in and out, with no sudden start to the turn. */
export const smoother = (t: number) => t * t * t * (t * (6 * t - 15) + 10);

/** Passes of a 1-2-1 filter round the loop: enough to round off the joins between arcs, too few to pull the arcs in. */
const SMOOTHING = 3;

function smoothed(stops: Stop[]) {
  let out = stops;
  for (let pass = 0; pass < SMOOTHING; pass++) {
    out = out.map((stop, i) => {
      const before = out[(i - 1 + out.length) % out.length];
      const after = out[(i + 1) % out.length];
      return [0, 1].map(n => stop[n].clone().multiplyScalar(2).add(before[n]).add(after[n]).multiplyScalar(0.25)) as Stop;
    });
  }
  return out;
}

/** The route through its keys, cut into STOP_COUNT stops the same distance apart, and where each leg falls on the loop (0–1). */
function route(scene: THREE.Object3D | null) {
  const all = legs(scene);
  const keys = all.flatMap(leg => leg.keys);
  const path = new THREE.CatmullRomCurve3(keys.map(k => k.at), true, "centripetal");
  const lengths = path.getLengths(SAMPLES);
  const uOf = keys.map((_, i) => lengths[Math.round((i / keys.length) * SAMPLES)] / lengths[SAMPLES]);

  const looks = keys.flatMap((k, i) => (k.look ? [{ look: k.look, u: uOf[i], i }] : []));
  const lookFrom = (at: THREE.Vector3, u: number) => {
    let n = looks.length - 1;
    while (n > 0 && looks[n].u > u) n--;
    const a = looks[n];
    const b = looks[(n + 1) % looks.length];
    const t = ((u - a.u + 1) % 1) / (((b.u - a.u + 1) % 1) || 1);
    // next door on an arc: straight on
    if (b.i === a.i + 1) return a.look.clone().lerp(b.look, t);
    // with a turn between them: swing the view round from one to the other, easing in and out.
    // Sliding the target across instead would whip past the camera when the two lie either side of it
    const toA = a.look.clone().sub(at);
    const toB = b.look.clone().sub(at);
    const s = smoother(t);
    const reach = THREE.MathUtils.lerp(toA.length(), toB.length(), s);
    const full = new THREE.Quaternion().setFromUnitVectors(toA.clone().normalize(), toB.clone().normalize());
    return toA.normalize().applyQuaternion(new THREE.Quaternion().slerp(full, s)).multiplyScalar(reach).add(at);
  };

  const stops = smoothed(Array.from({ length: STOP_COUNT }, (_, i): Stop => {
    const u = i / STOP_COUNT;
    const at = path.getPointAt(u);
    return [at, lookFrom(at, u)];
  }));

  // a leg's span starts halfway through the turn onto its ride: the caption shouldn't name a ride before it's in view
  const spans = new Map<string, [from: number, to: number]>();
  let first = 0;
  for (const leg of all) {
    const last = first + leg.keys.length - 1;
    const onto = Math.max(leg.keys.findIndex(k => k.look), 0);
    spans.set(leg.name, [(uOf[first] + uOf[first + onto]) / 2, uOf[last]]);
    first = last + 1;
  }
  return { stops, spans };
}

/** The stops, placed on the loaded scene, for a tour built on them elsewhere. */
export const tourStops = (scene: THREE.Object3D): Stop[] => {
  scene.updateMatrixWorld(true);
  return route(scene).stops;
};

export type Tour = { positionCurve: THREE.CatmullRomCurve3; lookCurve: THREE.CatmullRomCurve3 };

/** The tour's position and look curves, through the stops placed on the loaded scene. */
export function buildTour(scene: THREE.Object3D): Tour {
  const s = tourStops(scene);
  return {
    positionCurve: new THREE.CatmullRomCurve3(s.map(p => p[0]), true, "centripetal"),
    lookCurve: new THREE.CatmullRomCurve3(s.map(p => p[1]), true, "centripetal"),
  };
}

// the captions and the home page's cut go by the route as laid out: the loaded model only nudges it
const SPANS = route(null).spans;

/** The stops of the park's own stretch: from the approach to the gate to the end of the swing ride. */
export const PARK_STOPS = { from: Math.ceil(SPANS.get("gate")![0] * STOP_COUNT), to: Math.floor(SPANS.get("swings")![1] * STOP_COUNT) };

export type Caption = { title: string; line: string; from: number; to: number };

const caption = (leg: string, title: string, line: string): Caption => {
  const [from, to] = SPANS.get(leg)!;
  return { title, line, from, to };
};

export const CAPTIONS: Caption[] = [
  caption("gate", "The Gate", "In under the arch and down the boulevard."),
  caption("octopus", "The Octopus", "Eight arms spinning round the hub."),
  caption("tower", "Drop Tower", "A slow climb, then the drop."),
  caption("coaster", "Roller Coaster", "Seventy metres of track and one loop."),
  caption("ship", "Pirate Ship", "Swing up high and hold on tight."),
  caption("bumper", "Bumper Cars", "Eight cars, one small floor."),
  caption("swings", "Swing Ride", "Swing out wide and fly over the park."),
];

/** index into CAPTIONS for loop position `u`, or -1 between rides */
export const captionAt = (u: number) => CAPTIONS.findIndex(c => u >= c.from && u <= c.to);

/** Rides you can point at, by root node name. */
export const RIDES: Record<string, string> = {
  Octopus_Ride: "Octopus",
  RollerCoaster: "Roller Coaster",
  PirateShip: "Pirate Ship",
  BalloonTower: "Drop Tower",
  BumperCars: "Bumper Cars",
  SwingRide: "Swing Ride",
};
