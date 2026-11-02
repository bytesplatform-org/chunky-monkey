"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { DRACO } from "./draco";
import { rigPark, type Rig } from "./rigs";
import Terrain, { groundHeight } from "./Terrain";
import { RIDES, buildTour, captionAt, type Tour } from "./tour";

const MODEL = "/models/park.glb";

export type Mode = "tour" | "free";

/** A soft warm morning sky; the fog fades to it, so the edge of the land dissolves. */
const SKY = "#f3e2cd";

/** Free orbit's limits: never into the rides, never past the land, never under the ground, and pivoting within `reach` of the park. */
const ORBIT = { min: 20, max: 180, polar: Math.PI / 2 - 0.06, reach: 30, clearance: 3 };

/** Playback speed of the rides' own clips: OctopusSpin (10 s) and BalloonDrop (14 s) at 1. */
const RIDE_SPEED = 1;
const CLIPS = ["OctopusSpin", "BalloonDrop"];

// ---- the park

type RideInfo = {
  /** the ride's own copies of its materials, so a highlight lights only this ride */
  materials: THREE.MeshStandardMaterial[];
  /** a camera position and target that frame the ride */
  view: { position: THREE.Vector3; target: THREE.Vector3 };
};

type Park = { rig: Rig; rides: Map<string, RideInfo>; tour: Tour };

/**
 * One-time setup on the loaded scene: shadows, per-ride materials, the ride
 * rigs and the tour. useGLTF caches the scene across mounts, so the result is kept on the
 * scene itself and never built twice.
 */
function preparePark(scene: THREE.Object3D): Park {
  if (scene.userData.park) return scene.userData.park as Park;

  scene.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; }
  });

  scene.updateMatrixWorld(true);
  const rides = new Map<string, RideInfo>();
  for (const name of Object.keys(RIDES)) {
    const root = scene.getObjectByName(name);
    if (!root) continue;
    root.userData.ride = name;

    const copies = new Map<THREE.Material, THREE.MeshStandardMaterial>();
    root.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const original = mesh.material as THREE.MeshStandardMaterial;
      let copy = copies.get(original);
      if (!copy) {
        copy = original.clone();
        copy.userData.emissive = copy.emissive.clone();
        copies.set(original, copy);
      }
      mesh.material = copy;
    });

    root.traverse(o => { o.userData.pickable = true; });

    const box = new THREE.Box3().setFromObject(root);
    const centre = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    const out = new THREE.Vector3(centre.x, 0, centre.z);
    if (out.lengthSq() < 1) out.set(0, 0, 1);
    out.normalize();
    // out from the park centre and up, at least as far as free orbit lets the camera come in
    const target = centre.clone().setY(Math.min(centre.y, 3.5));
    const offset = out.multiplyScalar(radius * 1.5 + 4).add(new THREE.Vector3(0, radius * 0.6 + 2.5, 0));
    offset.setLength(Math.max(offset.length(), ORBIT.min + 2));
    rides.set(name, {
      materials: [...copies.values()],
      view: { position: target.clone().add(offset), target },
    });
  }

  // pointing only ever finds a ride: everything else opts out of raycasting
  scene.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && !mesh.userData.pickable) mesh.raycast = () => {};
  });

  const park: Park = { rig: rigPark(scene), rides, tour: buildTour(scene) };
  scene.userData.park = park;
  return park;
}

const rideOf = (o: THREE.Object3D | null) => {
  for (; o; o = o.parent) if (o.userData.ride) return o.userData.ride as string;
  return null;
};

function Model({ scene, animations, park, hovered, onHover, onPick }: {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  park: Park;
  hovered: string | null;
  onHover: (ride: string | null) => void;
  onPick: (ride: string) => void;
}) {
  // the octopus and the drop tower run on their own clips, bound to this
  // same (uncloned) scene; nothing else moves their rotor or gondola
  const { actions } = useAnimations(animations, scene);
  useEffect(() => {
    const playing = CLIPS.flatMap(n => actions[n] ?? []);
    playing.forEach(a => a.reset().setLoop(THREE.LoopRepeat, Infinity).setEffectiveTimeScale(RIDE_SPEED).play());
    return () => playing.forEach(a => a.stop());
  }, [actions]);

  // a soft lift in each part's own colour, never on the lamps (already lit)
  useEffect(() => {
    const ride = hovered ? park.rides.get(hovered) : undefined;
    ride?.materials.forEach(m => {
      if ((m.userData.emissive as THREE.Color).getHex() === 0) m.emissive.copy(m.color).multiplyScalar(0.32);
    });
    return () => ride?.materials.forEach(m => m.emissive.copy(m.userData.emissive as THREE.Color));
  }, [hovered, park]);

  useFrame(({ clock }, dt) => park.rig(clock.elapsedTime, dt));

  return (
    <primitive
      object={scene}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(rideOf(e.object)); }}
      onPointerLeave={() => onHover(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const ride = rideOf(e.object);
        if (ride) onPick(ride);
      }}
    />
  );
}

useGLTF.preload(MODEL, DRACO);

// ---- camera: the scroll-scrubbed tour, or free orbit

function CameraRig({ mode, focus, rides, tour: { positionCurve, lookCurve }, onCaption }: {
  mode: Mode;
  focus: { ride: string; at: number } | null;
  rides: Map<string, RideInfo>;
  tour: Tour;
  onCaption: (index: number) => void;
}) {
  const camera = useThree(s => s.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  const look = useRef(new THREE.Vector3(0, 2, 0));
  const tour = useRef({ u: 0, started: false, blend: 1, fromPosition: new THREE.Vector3(), fromLook: new THREE.Vector3() });
  const caption = useRef(-1);
  const scratch = useMemo(() => ({ position: new THREE.Vector3(), look: new THREE.Vector3() }), []);

  const setCaption = (index: number) => {
    if (index === caption.current) return;
    caption.current = index;
    onCaption(index);
  };

  // the shots are framed for landscape: on narrower screens, widen the lens to keep the park's width
  const aspect = useThree(s => s.size.width / s.size.height);
  const getState = useThree(s => s.get);
  useEffect(() => {
    const cam = getState().camera as THREE.PerspectiveCamera;
    const fit = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (MIN_ASPECT / aspect)));
    cam.fov = aspect >= MIN_ASPECT ? FOV : Math.min(72, fit);
    cam.updateProjectionMatrix();
  }, [aspect, getState]);

  // entering free orbit: pivot on whatever the tour was looking at
  // leaving it: ease from where the orbit left the camera back onto the tour
  useLayoutEffect(() => {
    const t = tour.current;
    if (mode === "free") {
      // pivot on what the tour was looking at, kept to the park when the tour is out over the land
      const target = look.current.clone();
      const flat = new THREE.Vector2(target.x, target.z);
      if (flat.length() > ORBIT.reach) {
        flat.setLength(ORBIT.reach);
        target.set(flat.x, 2, flat.y);
      }
      controls.current?.target.copy(target);
      controls.current?.update();
      return;
    }
    if (!t.started) return;
    t.fromPosition.copy(camera.position);
    t.fromLook.copy(look.current);
    t.blend = 0;
    const tween = gsap.to(t, { blend: 1, duration: 1.4, ease: "power2.inOut" });
    return () => { tween.kill(); };
  }, [mode, camera]);

  // a picked ride: glide the orbit over to it
  useEffect(() => {
    const ride = focus && rides.get(focus.ride);
    const c = controls.current;
    if (!ride || !c || mode !== "free") return;
    const tweens = [
      gsap.to(camera.position, { ...xyz(ride.view.position), duration: 1.6, ease: "power2.inOut" }),
      gsap.to(c.target, { ...xyz(ride.view.target), duration: 1.6, ease: "power2.inOut" }),
    ];
    const stop = () => tweens.forEach(t => t.kill());
    c.addEventListener("start", stop);
    return () => { stop(); c.removeEventListener("start", stop); };
  }, [focus, rides, mode, camera]);

  useFrame((state, dt) => {
    const cam = state.camera;
    if (mode === "free") {
      if (controls.current) look.current.copy(controls.current.target);
      // the polar limit is relative to the pivot; the hills rise above it, so stay clear of them too
      const ground = groundHeight(cam.position.x, cam.position.z);
      if (ground !== null && cam.position.y < ground + ORBIT.clearance) cam.position.y = ground + ORBIT.clearance;
      setCaption(-1);
      return;
    }
    const t = tour.current;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const target = max > 0 ? window.scrollY / max : 0;
    if (!t.started) { t.u = target; t.started = true; }
    let d = target - (((t.u % 1) + 1) % 1);
    d -= Math.round(d); // the loop wraps: always take the short way round
    t.u += d * (1 - Math.exp(-4 * Math.min(dt, 0.1)));
    const u = ((t.u % 1) + 1) % 1;

    positionCurve.getPoint(u, scratch.position);
    lookCurve.getPoint(u, scratch.look);
    if (t.blend < 1) {
      scratch.position.lerpVectors(t.fromPosition, scratch.position, t.blend);
      scratch.look.lerpVectors(t.fromLook, scratch.look, t.blend);
    }
    cam.position.copy(scratch.position);
    look.current.copy(scratch.look);
    cam.lookAt(scratch.look);
    setCaption(t.blend < 1 ? -1 : captionAt(u));
  });

  return mode === "free" ? (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.08}
      minDistance={ORBIT.min}
      maxDistance={ORBIT.max}
      maxPolarAngle={ORBIT.polar}
    />
  ) : null;
}

const xyz = (v: THREE.Vector3) => ({ x: v.x, y: v.y, z: v.z });

/** The lens (vertical degrees), and the narrowest aspect it still covers without widening. */
const FOV = 40;
const MIN_ASPECT = 1.2;

export default function ParkScene({ mode, hovered, focus, onHover, onPick, onCaption, onReady }: {
  mode: Mode;
  hovered: string | null;
  focus: { ride: string; at: number } | null;
  onHover: (ride: string | null) => void;
  onPick: (ride: string) => void;
  onCaption: (index: number) => void;
  onReady: () => void;
}) {
  const { scene, animations } = useGLTF(MODEL, DRACO);
  const park = useMemo(() => preparePark(scene), [scene]);
  useEffect(() => onReady(), [park, onReady]);

  return (
    <>
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 120, 320]} />
      {/* a bright, low morning sun; the shadow camera spans ~160 m around the park */}
      <hemisphereLight args={["#dbeaf7", "#8a9a72", 1.05]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[110, 150, 70]}
        color="#fff1dc"
        intensity={2.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
        shadow-camera-near={10}
        shadow-camera-far={480}
        shadow-bias={-0.0005}
        shadow-normalBias={0.12}
      />
      <Model
        scene={scene}
        animations={animations}
        park={park}
        hovered={hovered}
        onHover={onHover}
        onPick={onPick}
      />
      {/* the land streams in on its own, behind the park */}
      <Suspense fallback={null}>
        <Terrain />
      </Suspense>
      <CameraRig mode={mode} focus={focus} rides={park.rides} tour={park.tour} onCaption={onCaption} />
    </>
  );
}
