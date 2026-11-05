/**
 * The park's rides as things to point at, for the home page's tour, as on /park:
 * a ride under the cursor lights up, and picking one hands the camera to a free
 * orbit gliding over to it. Leaving eases back onto the tour.
 */

import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PARK_CENTRE } from "./arcadePath";

/** Free orbit's limits: never into the rides, never past the land, never under the ground, and pivoting within `reach` of the park. */
const ORBIT = { min: 20, max: 180, polar: Math.PI / 2 - 0.06, reach: 30, clearance: 3 };
/** The ease from where the orbit left the camera back onto the tour, in seconds. */
const BACK = 1.4;
/** The glide over to a picked ride, in seconds. */
const GLIDE = 1.6;

export type ParkRide = {
  /** the ride's root, and its own copies of its materials, so a highlight lights only this ride */
  root: THREE.Object3D;
  materials: THREE.MeshStandardMaterial[];
  /** a camera position and target that frame the ride, in the world */
  view: { position: THREE.Vector3; target: THREE.Vector3 };
};

export function createParkExplore(
  camera: THREE.PerspectiveCamera,
  rides: Map<string, ParkRide>,
  groundAt: (x: number, z: number) => number | null,
) {
  const roots = [...rides.values()].map(r => r.root);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hits: THREE.Intersection[] = [];
  const look = new THREE.Vector3();
  const from = { position: new THREE.Vector3(), look: new THREE.Vector3() };
  const back = { blend: 1 };
  let controls: OrbitControls | null = null;
  let glides: gsap.core.Tween[] = [];
  let lit: string | null = null;

  const stopGliding = () => {
    glides.forEach(t => t.kill());
    glides = [];
  };

  const explore = {
    get orbiting() { return !!controls; },

    /** The ride under a point on the screen, or null. */
    rideAt(clientX: number, clientY: number) {
      ndc.set((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
      camera.updateMatrixWorld();
      raycaster.setFromCamera(ndc, camera);
      hits.length = 0;
      raycaster.intersectObjects(roots, true, hits);
      for (let o: THREE.Object3D | null = hits[0]?.object ?? null; o; o = o.parent) {
        if (o.userData.ride) return o.userData.ride as string;
      }
      return null;
    },

    /** A soft lift in each part's own colour, never on the lamps (already lit). */
    highlight(name: string | null) {
      if (name === lit) return;
      if (lit) rides.get(lit)?.materials.forEach(m => m.emissive.copy(m.userData.emissive as THREE.Color));
      lit = name;
      if (name) rides.get(name)?.materials.forEach(m => {
        if ((m.userData.emissive as THREE.Color).getHex() === 0) m.emissive.copy(m.color).multiplyScalar(0.32);
      });
    },

    /** Takes the camera off the tour, if it's on it, and glides it over to a ride. `surface` takes the drags. */
    focus(name: string, surface: HTMLElement) {
      const ride = rides.get(name);
      if (!ride) return;
      if (!controls) {
        controls = new OrbitControls(camera, surface);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = ORBIT.min;
        controls.maxDistance = ORBIT.max;
        controls.maxPolarAngle = ORBIT.polar;
        // pivot on what the tour was looking at, kept to the park when the tour is out over the land
        const flat = new THREE.Vector2(look.x - PARK_CENTRE.x, look.z - PARK_CENTRE.z);
        if (flat.length() > ORBIT.reach) {
          flat.setLength(ORBIT.reach);
          look.set(PARK_CENTRE.x + flat.x, 2, PARK_CENTRE.z + flat.y);
        }
        controls.target.copy(look);
        controls.addEventListener("start", stopGliding);
      }
      stopGliding();
      const { position, target } = ride.view;
      glides = [
        gsap.to(camera.position, { x: position.x, y: position.y, z: position.z, duration: GLIDE, ease: "power2.inOut" }),
        gsap.to(controls.target, { x: target.x, y: target.y, z: target.z, duration: GLIDE, ease: "power2.inOut" }),
      ];
    },

    /** Hands the camera back to the tour, easing from wherever the orbit left it. */
    leave() {
      if (!controls) return;
      stopGliding();
      from.position.copy(camera.position);
      from.look.copy(controls.target);
      controls.dispose();
      controls = null;
      back.blend = 0;
      gsap.to(back, { blend: 1, duration: BACK, ease: "power2.inOut", overwrite: true });
    },

    /** One frame of free orbit. */
    orbit() {
      if (!controls) return;
      controls.update();
      look.copy(controls.target);
      // the polar limit is relative to the pivot; the hills rise above it, so stay clear of them too
      const ground = groundAt(camera.position.x, camera.position.z);
      if (ground !== null && camera.position.y < ground + ORBIT.clearance) camera.position.y = ground + ORBIT.clearance;
    },

    /** One frame of the tour: `tourLook` is where it's looking, with the camera already placed. */
    follow(tourLook: THREE.Vector3) {
      look.copy(tourLook);
      if (back.blend >= 1) return;
      camera.position.lerpVectors(from.position, camera.position, back.blend);
      look.lerpVectors(from.look, tourLook, back.blend);
      camera.lookAt(look);
    },

    dispose() {
      stopGliding();
      gsap.killTweensOf(back);
      controls?.dispose();
      controls = null;
    },
  };
  return explore;
}

export type ParkExplore = ReturnType<typeof createParkExplore>;
