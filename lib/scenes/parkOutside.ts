/**
 * The park outside the arcade's exit door, with the land around it: its own
 * scene, so its daylight never reaches the room. The park is turned so its gate
 * faces the door, with the door on the flat of the road out of the gate, about
 * 20 m back. Everything behind the door is cut away: the land was never meant
 * to hold a building, and its hills would come up through the arcade's floor.
 */

import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Frame } from "@/lib/gl/stage";
import { rigPark } from "@/components/park/rigs";
import { RIDES } from "@/components/park/tour";
import { mergeParts } from "./mergeParts";
import { PARK_CENTRE } from "./arcadePath";
import type { ParkRide } from "./parkExplore";
import { buildParkTour } from "./parkTour";

/** Lifts the road to the foot of the door's steps. */
const LIFT = 0.5;

/** The door plane, a little in front of the door itself. */
const CUT_AT_DOOR = -32.5;
/** Far behind everything: moving the plane here brings the land back without recompiling a material. */
const NO_CUT = 10000;

/** The rides that move: their parts can't be merged. */
const MOVING = new Set(["PirateShip", "SwingRide", "RollerCoaster", "BalloonTower", "BumperCars", "Octopus_Ride"]);

/** #f3e2cd as it should read on screen, before ACES (which would otherwise grey it down). */
const SKY_ON_SCREEN = "#f3e2cd";
const SKY_BEFORE_ACES: [number, number, number] = [1.844, 0.956, 0.507];

/** The lift a highlight is measured against, and a camera view framing it: as on /park, in the park's own space. */
function rideView(root: THREE.Object3D, land: THREE.Matrix4, minDistance: number) {
  const box = new THREE.Box3().setFromObject(root);
  const centre = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).length() / 2;
  const out = new THREE.Vector3(centre.x, 0, centre.z);
  if (out.lengthSq() < 1) out.set(0, 0, 1);
  out.normalize();
  // out from the park centre and up, at least as far as free orbit lets the camera come in
  const target = centre.clone().setY(Math.min(centre.y, 3.5));
  const offset = out.multiplyScalar(radius * 1.5 + 4).add(new THREE.Vector3(0, radius * 0.6 + 2.5, 0));
  offset.setLength(Math.max(offset.length(), minDistance + 2));
  return { position: target.clone().add(offset).applyMatrix4(land), target: target.applyMatrix4(land) };
}

/** Free orbit comes no closer than this (see parkExplore.ts): the framing has to respect it. */
const NEAREST_VIEW = 20;

export function createParkOutside(park: GLTF, terrain: GLTF, opts: { composer: boolean; shadows: boolean }) {
  const cut = new THREE.Plane(new THREE.Vector3(1, 0, 0), CUT_AT_DOOR);
  const scene = new THREE.Scene();
  const fogColor = new THREE.Color().setRGB(...SKY_BEFORE_ACES);
  // a composer's ACES takes the background with it; drawn straight, the background skips tone mapping
  scene.background = opts.composer ? fogColor.clone() : new THREE.Color(SKY_ON_SCREEN);
  scene.fog = new THREE.Fog(fogColor, 120, 320);

  scene.add(new THREE.HemisphereLight("#dbeaf7", "#8a9a72", 1.05));
  scene.add(new THREE.AmbientLight("#ffffff", 0.18));
  const sun = new THREE.DirectionalLight("#fff1dc", 2.3);
  sun.position.set(PARK_CENTRE.x + 110, 150, PARK_CENTRE.z + 70);
  sun.target.position.copy(PARK_CENTRE);
  scene.add(sun, sun.target);
  if (opts.shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -70;
    sun.shadow.camera.right = sun.shadow.camera.top = 70;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 400;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.12;
  }

  // the model's +z (out of the gate) points back along -x, at the door
  const land = new THREE.Group();
  land.rotation.y = -Math.PI / 2;
  land.position.set(PARK_CENTRE.x, LIFT, PARK_CENTRE.z);
  land.updateMatrix();
  scene.add(land);

  // a private copy: the rigs and the merge rearrange it
  const model = park.scene.clone(true);
  park.scene.updateMatrixWorld(true);
  const rides = new Map<string, ParkRide>();
  for (const name of Object.keys(RIDES)) {
    const root = model.getObjectByName(name);
    const original = park.scene.getObjectByName(name);
    if (!root || !original) continue;
    root.userData.ride = name;
    const copies = new Map<THREE.Material, THREE.MeshStandardMaterial>();
    root.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const shared = mesh.material as THREE.MeshStandardMaterial;
      let copy = copies.get(shared);
      if (!copy) {
        copy = shared.clone();
        copy.userData.emissive = copy.emissive.clone();
        copies.set(shared, copy);
      }
      mesh.material = copy;
    });
    rides.set(name, { root, materials: [...copies.values()], view: rideView(original, land.matrix, NEAREST_VIEW) });
  }
  const rig = rigPark(model);
  const mixer = new THREE.AnimationMixer(model);
  park.animations.forEach(clip => mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play());
  mergeParts(model, { skip: o => MOVING.has(o.name), detach: true }).forEach(part => land.add(part));
  land.add(model);
  mergeParts(terrain.scene).forEach(part => land.add(part));

  // the merge leaves the originals, in the park's own space: free orbit keeps clear of the hills on them
  const landforms: THREE.Mesh[] = [];
  terrain.scene.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && /Terrain_(Ground|Hill)/.test(`${mesh.name} ${mesh.parent?.name ?? ""}`)) landforms.push(mesh);
  });
  const fromWorld = land.matrix.clone().invert();
  const down = new THREE.Raycaster();
  down.ray.direction.set(0, -1, 0);
  const hits: THREE.Intersection[] = [];

  land.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = mesh.receiveShadow = opts.shadows;
    (mesh.material as THREE.Material).clippingPlanes = [cut];
  });

  return {
    scene,
    rides,
    /** Height of the land under a point in the world, or null where there's none. */
    groundAt(x: number, z: number) {
      down.ray.origin.set(x, 500, z).applyMatrix4(fromWorld);
      let top: number | null = null;
      for (const mesh of landforms) {
        hits.length = 0;
        THREE.Mesh.prototype.raycast.call(mesh, down, hits);
        for (const hit of hits) top = top === null ? hit.point.y : Math.max(top, hit.point.y);
      }
      return top === null ? null : top + LIFT;
    },
    /** the drone tour, on this park */
    tour: buildParkTour(park.scene, land.matrix),
    /** Whether the land stops at the door. The tour flies with the room undrawn, so it wants all of it. */
    cutAtDoor(on: boolean) {
      cut.constant = on ? CUT_AT_DOOR : NO_CUT;
    },
    update(frame: Frame) {
      rig(frame.time, frame.dt);
      mixer.update(frame.dt);
    },
    dispose() {
      mixer.stopAllAction();
      sun.shadow.map?.dispose();
    },
  };
}
