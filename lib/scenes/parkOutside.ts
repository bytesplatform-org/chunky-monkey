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
import { mergeParts } from "./mergeParts";
import { PARK_CENTRE } from "./arcadePath";
import { buildParkTour } from "./parkTour";

/** Lifts the road to the foot of the door's steps. */
const LIFT = 0.5;

/** The door plane, a little in front of the door itself. */
const CUT_AT_DOOR = -32.5;
/** Far behind everything: moving the plane here brings the land back without recompiling a material. */
const NO_CUT = 10000;

/** The rides that move: their parts can't be merged. */
const MOVING = new Set(["Ferris_Wheel", "SwingRide", "RollerCoaster", "BalloonTower", "BumperCars", "Octopus_Ride"]);

/** #f3e2cd as it should read on screen, before ACES (which would otherwise grey it down). */
const SKY_ON_SCREEN = "#f3e2cd";
const SKY_BEFORE_ACES: [number, number, number] = [1.844, 0.956, 0.507];

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
  const rig = rigPark(model);
  const mixer = new THREE.AnimationMixer(model);
  park.animations.forEach(clip => mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play());
  mergeParts(model, { skip: o => MOVING.has(o.name), detach: true }).forEach(part => land.add(part));
  land.add(model);
  mergeParts(terrain.scene).forEach(part => land.add(part));

  land.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = mesh.receiveShadow = opts.shadows;
    (mesh.material as THREE.Material).clippingPlanes = [cut];
  });

  return {
    scene,
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
