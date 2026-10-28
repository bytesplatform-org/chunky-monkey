/**
 * The front-seat coaster ride as a stage pass. The exported ride is a 30 s
 * clip; we sample the seat's path once, then place the camera at whatever
 * clip time `state.target` asks for. The camera eases toward it, so a
 * scroll-scrubbed target still rides smoothly, and the seat only shakes
 * while it's actually moving.
 */

import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Pass } from "@/lib/gl/stage";

/** Clip seconds: just below the crest of the lift hill, and rolling back into the station. */
export const RIDE = { from: 4.5, to: 29.2 };

/** A wider lens in portrait so the track still fills the frame. */
const FOV = { landscape: 80, portrait: 95 };

/** How quickly the camera catches up with the scrubbed target (per second). */
const FOLLOW = 5;

export function createCoaster(gltf: GLTF, opts: { shake: boolean }) {
  const state = { target: RIDE.from, t: RIDE.from };

  const night = new THREE.Color("#0b0920");
  const scene = new THREE.Scene();
  scene.background = night;
  scene.fog = new THREE.Fog(night, 140, 760);

  const model = gltf.scene;
  scene.add(model);
  model.updateMatrixWorld(true);

  // The 875 track ties share one mesh: draw them as a single instanced mesh.
  const ties = model.getObjectByName("Ties");
  const proto = ties?.children.find((c): c is THREE.Mesh => (c as THREE.Mesh).isMesh);
  if (ties && proto) {
    const instanced = new THREE.InstancedMesh(proto.geometry, proto.material, ties.children.length);
    ties.children.forEach((tie, i) => instanced.setMatrixAt(i, tie.matrixWorld));
    instanced.instanceMatrix.needsUpdate = true;
    scene.add(instanced);
    ties.visible = false;
  }

  // We ride in the robot's seat. Hide all of it: scrubbing can stop on any
  // frame, and its arms and body would fill the lens. Its transforms still
  // animate, so the eye still steers the camera.
  const bot = model.getObjectByName("Bot")!;
  const eye = model.getObjectByName("EZ_Eye") ?? bot;
  bot.visible = false;

  // ---- lights: dusk sky, a warm key, and a lamp that rides with the camera
  scene.add(new THREE.HemisphereLight("#8aa0ff", "#2b1a5c", 1.1));
  const key = new THREE.DirectionalLight("#fff2d0", 1.6);
  key.position.set(220, 320, 120);
  scene.add(key);
  const lamp = new THREE.PointLight("#ffc93c", 40, 140, 1.4);

  // ---- ground and stars
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1400, 64),
    new THREE.MeshStandardMaterial({ color: "#100c2e", roughness: 1, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -6;
  scene.add(ground);

  const starCount = 1400;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u, phi = Math.acos(1 - v) * 0.5; // upper hemisphere
    const r = 900;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  scene.add(new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(starPos, 3)),
    new THREE.PointsMaterial({ color: "#fff6e5", size: 2.2, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.8 }),
  ));

  // ---- sample the ride once: eye position + seat orientation along the clip
  const clip = gltf.animations[0];
  const mixer = new THREE.AnimationMixer(model);
  const action = mixer.clipAction(clip);
  action.play();
  const STEP = 1 / 60;
  const samples: { p: THREE.Vector3; up: THREE.Vector3 }[] = [];
  for (let t = 0; t <= clip.duration + 1e-6; t += STEP) {
    action.time = Math.min(t, clip.duration);
    mixer.update(0);
    bot.updateWorldMatrix(true, true);
    const p = new THREE.Vector3();
    eye.getWorldPosition(p);
    const q = new THREE.Quaternion();
    bot.getWorldQuaternion(q);
    samples.push({ p, up: new THREE.Vector3(0, 1, 0).applyQuaternion(q) });
  }
  const sampleAt = (t: number, out: THREE.Vector3, up?: THREE.Vector3) => {
    const x = THREE.MathUtils.clamp(t, 0, clip.duration) / STEP;
    const i = Math.min(samples.length - 2, Math.floor(x));
    const f = x - i;
    out.lerpVectors(samples[i].p, samples[i + 1].p, f);
    up?.lerpVectors(samples[i].up, samples[i + 1].up, f).normalize();
  };

  // ---- camera
  const camera = new THREE.PerspectiveCamera(FOV.landscape, 1, 0.5, 2000);
  camera.add(lamp);
  lamp.position.set(0, 2, -6);
  scene.add(camera);

  const pos = new THREE.Vector3(), ahead = new THREE.Vector3(), behind = new THREE.Vector3(), last = new THREE.Vector3();
  const fwd = new THREE.Vector3(0, 0, -1), smoothFwd = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), smoothUp = new THREE.Vector3(0, 1, 0);
  const look = new THREE.Vector3();
  let first = true;
  let shake = 0;

  const pass: Pass = {
    resize(width, height) {
      camera.aspect = width / height;
      camera.fov = width < height ? FOV.portrait : FOV.landscape;
      camera.updateProjectionMatrix();
    },
    render(renderer, frame) {
      // follow the scrubbed target
      const k = first ? 1 : 1 - Math.exp(-FOLLOW * frame.dt);
      state.t += (state.target - state.t) * k;
      const t = state.t;
      action.time = t;
      mixer.update(0);
      model.updateMatrixWorld(true);

      sampleAt(t, pos, up);
      sampleAt(t + 0.18, ahead);
      sampleAt(t - 0.18, behind);
      fwd.subVectors(ahead, behind);
      if (fwd.lengthSq() > 1e-6) fwd.normalize();
      if (first) { smoothFwd.copy(fwd); smoothUp.copy(up); last.copy(pos); first = false; }
      smoothFwd.lerp(fwd, 0.18).normalize();
      smoothUp.lerp(up, 0.12).normalize();

      // seat shake from how fast we're really moving: none when the scroll rests
      const speed = frame.dt > 0 ? pos.distanceTo(last) / frame.dt : 0;
      last.copy(pos);
      shake += ((opts.shake ? Math.min(1, speed / 90) * 0.35 : 0) - shake) * 0.1;
      const now = frame.time;
      camera.position.copy(pos).addScaledVector(smoothFwd, 0.6);
      camera.position.x += Math.sin(now * 23) * shake * 0.5;
      camera.position.y += Math.sin(now * 31 + 1) * shake;
      camera.up.copy(smoothUp);
      camera.lookAt(look.copy(camera.position).addScaledVector(smoothFwd, 12));
      camera.rotateZ(Math.sin(now * 17) * shake * 0.012);

      const toneMapping = renderer.toneMapping;
      const exposure = renderer.toneMappingExposure;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.render(scene, camera);
      renderer.toneMapping = toneMapping;
      renderer.toneMappingExposure = exposure;
    },
    dispose() {
      mixer.stopAllAction();
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach(mat => {
          Object.values(mat).forEach(v => { if (v instanceof THREE.Texture) v.dispose(); });
          mat.dispose();
        });
      });
    },
  };

  return { pass, state };
}
