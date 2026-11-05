"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { AMBIENT, BACKGROUND_BEFORE_ACES, BLOOM, HEMISPHERE, LAMP, LAMPS } from "@/lib/scenes/arcadeLights";
import { DRACO } from "../park/draco";
import { MAX_PITCH, SPAWN, confine, speedWith, type WalkInput } from "./walk";

const MODEL = "/models/arcade.glb";

/** How quickly the walk reaches the speed asked of it, and coasts to a stop (per second). */
const DAMPING = 8;

/** The first-person camera: Blender walk mode's feel, on keys or joystick. */
function Walker({ inputRef, active }: { inputRef: RefObject<WalkInput>; active: boolean }) {
  const view = useRef({ yaw: SPAWN.yaw, pitch: SPAWN.pitch });
  const velocity = useRef(new THREE.Vector3());
  const scratch = useRef({ wish: new THREE.Vector3(), next: new THREE.Vector3() });

  useFrame((state, delta) => {
    const cam = state.camera;
    const dt = Math.min(delta, 0.1);
    const io = inputRef.current;
    const v = velocity.current;
    const { wish, next } = scratch.current;

    if (io.reset) {
      io.reset = false;
      view.current.yaw = SPAWN.yaw;
      view.current.pitch = SPAWN.pitch;
      v.set(0, 0, 0);
      cam.position.set(...SPAWN.position);
    }

    view.current.yaw += io.look.yaw;
    view.current.pitch = THREE.MathUtils.clamp(view.current.pitch + io.look.pitch, -MAX_PITCH, MAX_PITCH);
    io.look.yaw = io.look.pitch = 0;
    cam.rotation.set(view.current.pitch, view.current.yaw, 0, "YXZ");

    // walking follows the view's heading only, so looking up never climbs
    wish.set(0, 0, 0);
    if (active) {
      const held = (...codes: string[]) => (codes.some(c => io.keys.has(c)) ? 1 : 0);
      const right = held("KeyD") - held("KeyA") + io.stick.x;
      const forward = held("KeyW") - held("KeyS") + io.stick.y;
      const sin = Math.sin(view.current.yaw), cos = Math.cos(view.current.yaw);
      wish.set(cos * right - sin * forward, 0, -sin * right - cos * forward);
      if (wish.lengthSq() > 1) wish.normalize();
      wish.y = held("KeyE", "Space") - held("KeyQ", "ControlLeft", "ControlRight");
      wish.multiplyScalar(speedWith(io.speed, io.keys));
    }
    v.lerp(wish, 1 - Math.exp(-DAMPING * dt));

    next.copy(cam.position).addScaledVector(v, dt);
    confine(cam.position, next);
    // whatever a wall stopped, stops: no pressing on through it, or sliding off it late
    if (dt > 0) {
      if (next.x === cam.position.x) v.x = 0;
      if (next.y === cam.position.y) v.y = 0;
      if (next.z === cam.position.z) v.z = 0;
    }
    cam.position.copy(next);
  });

  return null;
}

function Arcade({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(MODEL, DRACO);
  useEffect(() => onReady(), [onReady]);
  return <primitive object={scene} />;
}

useGLTF.preload(MODEL, DRACO);

export default function ArcadeScene({ inputRef, active, onReady }: {
  inputRef: RefObject<WalkInput>;
  active: boolean;
  onReady: () => void;
}) {
  return (
    <>
      <color attach="background" args={[BACKGROUND_BEFORE_ACES]} />
      <ambientLight intensity={AMBIENT} />
      <hemisphereLight args={[HEMISPHERE.sky, HEMISPHERE.ground, HEMISPHERE.intensity]} />
      {LAMPS.map(position => (
        <pointLight key={position.join()} position={position} {...LAMP} />
      ))}
      <Arcade onReady={onReady} />
      <Walker inputRef={inputRef} active={active} />
      {/* three skips the renderer's tone mapping inside a composer, so ACES is an effect here, after the bloom */}
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur {...BLOOM} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
}
