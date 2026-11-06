/**
 * Ride animation for park.glb. The model ships every ride as a flat list of
 * parts under one node (spokes beside gondolas beside the base), so each rig
 * regroups the moving parts under pivots at load, keeping their world
 * placement, then drives the pivots each frame from the clock. The octopus,
 * the drop tower, the bumper cars and the pirate ship aren't here: they ship
 * their own clips, played in ParkScene.
 */

import * as THREE from "three";

export type Rig = (time: number, dt: number) => void;

const UP = new THREE.Vector3(0, 1, 0);

/** the children of `root` whose names match, copied so they can be re-parented while iterating */
const parts = (root: THREE.Object3D, re: RegExp) => root.children.filter(c => re.test(c.name));

/** a new pivot at `position` (in root space) holding `members`, which keep their world transforms */
function pivot(root: THREE.Object3D, position: THREE.Vector3, members: THREE.Object3D[]) {
  const g = new THREE.Group();
  g.position.copy(position);
  root.add(g);
  members.forEach(m => g.attach(m));
  return g;
}

const named = (root: THREE.Object3D, name: string) => root.getObjectByName(name);

/** Top, chains and seats turn around the column, with a slow wobble. */
function swingRide(root: THREE.Object3D): Rig {
  const spinner = pivot(root, new THREE.Vector3(), parts(root, /^SW_(Top|Ring|Light|Chain|Seat|Back)/));
  return time => {
    spinner.rotation.set(Math.sin(time * 0.5) * 0.035, time * 0.8, Math.cos(time * 0.4) * 0.035);
  };
}

/**
 * The train runs the track. The ties are placed in track order and tilted
 * with it, so a curve through them is the rail, and their up axes give the
 * banking (the loop included). Each car keeps its offset from the frame it
 * started on; the train speeds up as it drops.
 */
function rollerCoaster(root: THREE.Object3D): Rig {
  const ties: THREE.Object3D[] = [];
  for (let i = 0; ; i++) {
    const tie = named(root, `RollerCoaster_Tie_${i}`);
    if (!tie) break;
    ties.push(tie);
  }
  const rail = new THREE.CatmullRomCurve3(ties.map(t => t.position.clone()), true, "centripetal");
  rail.arcLengthDivisions = 800;
  const banking = new THREE.CatmullRomCurve3(ties.map(t => UP.clone().applyQuaternion(t.quaternion)), true);
  const length = rail.getLength();
  let top = -Infinity, bottom = Infinity;
  ties.forEach(t => { top = Math.max(top, t.position.y); bottom = Math.min(bottom, t.position.y); });

  const p = new THREE.Vector3(), tangent = new THREE.Vector3(), up = new THREE.Vector3(), side = new THREE.Vector3();
  const frame = (u: number, out: THREE.Matrix4) => {
    const t = rail.getUtoTmapping(((u % 1) + 1) % 1, 0); // 0: map by u, not by a distance
    rail.getPoint(t, p);
    rail.getTangent(t, tangent);
    banking.getPoint(t, up);
    side.crossVectors(up, tangent).normalize();
    up.crossVectors(tangent, side).normalize();
    return out.makeBasis(side, up, tangent).setPosition(p);
  };

  // where along the rail each car starts
  const SAMPLES = 1500;
  const nearest = (pos: THREE.Vector3) => {
    let best = 0, bestD = Infinity;
    for (let s = 0; s < SAMPLES; s++) {
      const d = rail.getPointAt(s / SAMPLES, p).distanceToSquared(pos);
      if (d < bestD) { bestD = d; best = s / SAMPLES; }
    }
    return best;
  };

  const m = new THREE.Matrix4();
  const cars: { group: THREE.Group; u0: number; offset: THREE.Matrix4 }[] = [];
  for (let i = 0; ; i++) {
    const body = named(root, `RollerCoaster_Car_${i}`);
    if (!body) break;
    const group = pivot(root, body.position, parts(root, new RegExp(`^RollerCoaster_(Car|CarBack)_${i}$`)));
    const u0 = nearest(group.position);
    group.updateMatrix();
    cars.push({ group, u0, offset: frame(u0, new THREE.Matrix4()).invert().multiply(group.matrix) });
  }

  let travelled = 0;
  return (_time, dt) => {
    // a touch of gravity: slow over the crests, quick through the dips
    const lead = rail.getPointAt(((cars[0].u0 + travelled) % 1 + 1) % 1, p).y;
    const speed = 3.2 + 2.2 * Math.sqrt(Math.max(0, (top - lead) / (top - bottom)));
    travelled = (travelled + (speed * Math.min(dt, 0.1)) / length) % 1;
    cars.forEach(({ group, u0, offset }) => {
      frame(u0 + travelled, m).multiply(offset).decompose(group.position, group.quaternion, group.scale);
    });
  };
}

const RIGS: Record<string, (root: THREE.Object3D) => Rig> = {
  SwingRide: swingRide,
  RollerCoaster: rollerCoaster,
};

/** Builds every ride rig found in the scene; returns one function that advances them all. */
export function rigPark(scene: THREE.Object3D): Rig {
  scene.updateMatrixWorld(true);
  const rigs = Object.entries(RIGS).flatMap(([name, build]) => {
    const root = scene.getObjectByName(name);
    return root ? [build(root)] : [];
  });
  return (time, dt) => rigs.forEach(r => r(time, dt));
}
