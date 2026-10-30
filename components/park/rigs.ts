/**
 * Ride animation for park.glb. The model ships every ride as a flat list of
 * parts under one node (spokes beside gondolas beside the base), so each rig
 * regroups the moving parts under pivots at load, keeping their world
 * placement, then drives the pivots each frame from the clock.
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

/** Wheel turns on its axle; gondolas counter-turn so they hang level, with a little sway. */
function ferrisWheel(root: THREE.Object3D): Rig {
  const axle = named(root, "FW_Axle")!;
  const axis = UP.clone().applyQuaternion(axle.quaternion).normalize();
  const wheel = pivot(root, axle.position, parts(root, /^FW_(Rim|RimIn|Spoke|Hub|Axle)/));

  const gondolas: THREE.Group[] = [];
  for (let i = 0; ; i++) {
    const hanger = named(root, `FW_Hanger_${i}`);
    if (!hanger) break;
    const top = hanger.position.clone().add(new THREE.Vector3(0, 0.25, 0));
    const members = ["FW_Gondola_", "FW_GRoof_", "FW_GWin_", "FW_Hanger_"].map(n => named(root, n + i)!);
    const g = pivot(root, top, members);
    wheel.attach(g);
    gondolas.push(g);
  }

  return time => {
    const a = time * 0.12;
    wheel.quaternion.setFromAxisAngle(axis, a);
    gondolas.forEach((g, i) => g.quaternion.setFromAxisAngle(axis, -a + Math.sin(time * 1.4 + i) * 0.04));
  };
}

/** Platform and canopy turn; each horse rides up and down its pole. */
function carousel(root: THREE.Object3D): Rig {
  const horses: THREE.Group[] = [];
  for (let i = 0; ; i++) {
    const members = parts(root, new RegExp(`^CR_(HBody|HHead|HNeck|Saddle)_${i}$|^CR_HLeg_${i}_`));
    if (!members.length) break;
    horses.push(pivot(root, new THREE.Vector3(), members));
  }
  const spin = pivot(root, new THREE.Vector3(), root.children.filter(c => !/^CR_(Base|Step)/.test(c.name)));

  return time => {
    spin.rotation.y = time * 0.35;
    horses.forEach((h, i) => { h.position.y = Math.sin(time * 1.8 + i * Math.PI) * 0.16; });
  };
}

/**
 * The arms turn around the body, each lifting and dropping in sequence, and
 * every car spins on its strut and stays level while its arm tilts.
 */
function octopus(root: THREE.Object3D): Rig {
  root.updateMatrixWorld(true);
  const arms = parts(root, /^Octo_Arm_\d+$/);
  const bearings = arms.map(a => {
    const c = root.worldToLocal(new THREE.Box3().setFromObject(a).getCenter(new THREE.Vector3()));
    return c.setY(0).normalize();
  });
  const taken = new Set<number>();

  const rotor = new THREE.Group();
  root.add(rotor);

  const legs: { pivot: THREE.Group; car: THREE.Group; axis: THREE.Vector3 }[] = [];
  for (let i = 0; ; i++) {
    const carBody = named(root, `Octo_Car_${i}`);
    if (!carBody) break;
    const dir = new THREE.Vector3(carBody.position.x, 0, carBody.position.z).normalize();

    // the free arm whose middle sits closest to this car's bearing
    let best = -1;
    bearings.forEach((b, k) => {
      if (!taken.has(k) && (best < 0 || b.dot(dir) > bearings[best].dot(dir))) best = k;
    });
    if (best < 0) break;
    taken.add(best);

    // the car hangs from the top of its strut, where the arm meets it, so it turns and levels about that joint
    const strut = named(root, `Octo_Strut_${i}`)!;
    const joint = strut.position.clone().add(new THREE.Vector3(0, 0.35, 0));
    const car = pivot(root, joint, parts(root, new RegExp(`^Octo_(Car|Seat|SeatBack|LapBar|Stripe|Strut)_${i}$`)));
    const shoulder = dir.clone().multiplyScalar(1.45).setY(2.6);
    const leg = pivot(root, shoulder, [arms[best], ...parts(root, new RegExp(`^Octo_Cup_${i}_`)), car]);
    rotor.attach(leg);
    legs.push({ pivot: leg, car, axis: dir.clone().cross(UP).normalize() });
  }

  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
  return time => {
    rotor.rotation.y = time * 0.45;
    legs.forEach(({ pivot: leg, car, axis }, i) => {
      const lift = (0.5 + 0.5 * Math.sin(time * 0.9 + i * (Math.PI / 2))) * 0.26;
      leg.quaternion.setFromAxisAngle(axis, lift);
      qa.setFromAxisAngle(axis, -lift);
      qb.setFromAxisAngle(UP, time * 1.1 + i);
      car.quaternion.multiplyQuaternions(qa, qb);
    });
  };
}

/** Top, chains and seats turn around the column, with a slow wobble. */
function swingRide(root: THREE.Object3D): Rig {
  const spinner = pivot(root, new THREE.Vector3(), parts(root, /^SW_(Top|Ring|Light|Chain|Seat|Back)/));
  return time => {
    spinner.rotation.set(Math.sin(time * 0.5) * 0.035, time * 0.8, Math.cos(time * 0.4) * 0.035);
  };
}

/** The car climbs the column, turning slowly, and sinks back down. */
function balloonTower(root: THREE.Object3D): Rig {
  const lift = pivot(root, new THREE.Vector3(), parts(root, /^DT_(Car|CarBand|Seat)/));
  return time => {
    lift.position.y = (0.5 - 0.5 * Math.cos(time * 0.45)) * 3.6;
    lift.rotation.y = time * 0.3;
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
  Ferris_Wheel: ferrisWheel,
  Carousel: carousel,
  Octopus_Ride: octopus,
  SwingRide: swingRide,
  BalloonTower: balloonTower,
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
