"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { rigPark, type Rig } from "./rigs";
import { RIDES, captionAt, lookCurve, positionCurve } from "./tour";

const MODEL = "/models/park.glb";
const DRACO = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";

export type Mode = "tour" | "free";

const SKY = { top: "#7fb4e4", horizon: "#ffd9b2", bottom: "#f3b38c" };

// ---- sky: a gradient dome that travels with the camera

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uBottom;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 c = h > 0.0
      ? mix(uHorizon, uTop, pow(smoothstep(0.0, 1.0, h), 0.6))
      : mix(uHorizon, uBottom, smoothstep(0.0, 0.45, -h));
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;

function Sky() {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({
    uTop: { value: new THREE.Color(SKY.top) },
    uHorizon: { value: new THREE.Color(SKY.horizon) },
    uBottom: { value: new THREE.Color(SKY.bottom) },
  }), []);
  useFrame(({ camera }) => mesh.current?.position.copy(camera.position));
  return (
    <mesh ref={mesh} renderOrder={-1} raycast={() => null}>
      <sphereGeometry args={[400, 32, 16]} />
      <shaderMaterial vertexShader={skyVertex} fragmentShader={skyFragment} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

// ---- the park

type RideInfo = {
  /** the ride's own copies of its materials, so a highlight lights only this ride */
  materials: THREE.MeshStandardMaterial[];
  /** a camera position and target that frame the ride */
  view: { position: THREE.Vector3; target: THREE.Vector3 };
};

type Park = { rig: Rig; rides: Map<string, RideInfo> };

/**
 * One-time setup on the loaded scene: shadows, per-ride materials and the ride
 * rigs. useGLTF caches the scene across mounts, so the result is kept on the
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

    const box = new THREE.Box3().setFromObject(root);
    const centre = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    const out = new THREE.Vector3(centre.x, 0, centre.z);
    if (out.lengthSq() < 1) out.set(0, 0, 1);
    out.normalize();
    rides.set(name, {
      materials: [...copies.values()],
      view: {
        position: centre.clone().addScaledVector(out, radius * 1.5 + 4).add(new THREE.Vector3(0, radius * 0.6 + 2.5, 0)),
        target: centre.clone().setY(Math.min(centre.y, 3.5)),
      },
    });
  }

  const park: Park = { rig: rigPark(scene), rides };
  scene.userData.park = park;
  return park;
}

const rideOf = (o: THREE.Object3D | null) => {
  for (; o; o = o.parent) if (o.userData.ride) return o.userData.ride as string;
  return null;
};

function Model({ hovered, onHover, onPick, onReady }: {
  hovered: string | null;
  onHover: (ride: string | null) => void;
  onPick: (ride: string) => void;
  onReady: (rides: Map<string, RideInfo>) => void;
}) {
  const { scene } = useGLTF(MODEL, DRACO);
  const park = useMemo(() => preparePark(scene), [scene]);

  useEffect(() => onReady(park.rides), [park, onReady]);

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

function CameraRig({ mode, focus, rides, onCaption }: {
  mode: Mode;
  focus: { ride: string; at: number } | null;
  rides: Map<string, RideInfo> | null;
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
      controls.current?.target.copy(look.current);
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
    const ride = focus && rides?.get(focus.ride);
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

  useFrame((_, dt) => {
    if (mode === "free") {
      if (controls.current) look.current.copy(controls.current.target);
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
    camera.position.copy(scratch.position);
    look.current.copy(scratch.look);
    camera.lookAt(scratch.look);
    setCaption(t.blend < 1 ? -1 : captionAt(u));
  });

  return mode === "free" ? (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.08}
      minDistance={5}
      maxDistance={95}
      maxPolarAngle={Math.PI * 0.47}
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
  const [rides, setRides] = useState<Map<string, RideInfo> | null>(null);
  const handleReady = useCallback((r: Map<string, RideInfo>) => { setRides(r); onReady(); }, [onReady]);

  return (
    <>
      <Sky />
      <fog attach="fog" args={[SKY.horizon, 70, 230]} />
      <hemisphereLight args={["#dcedff", "#f0c49a", 1.25]} />
      <directionalLight
        position={[28, 40, 18]}
        color="#fff0d6"
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
      />
      <Model
        hovered={hovered}
        onHover={onHover}
        onPick={onPick}
        onReady={handleReady}
      />
      <CameraRig mode={mode} focus={focus} rides={rides} onCaption={onCaption} />
    </>
  );
}
