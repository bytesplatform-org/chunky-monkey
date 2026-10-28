/**
 * The hero's 3D carnival, built from primitives — no model files to load:
 * a Ferris wheel in the middle, a carousel front-left, a drop tower right,
 * a skyline far behind. Every light is a chasing point-sprite bulb
 * (lib/shaders/bulbs.ts).
 *
 * Drive it with three numbers: `intro` (0 → 1, the camera's arrival),
 * `progress` (0 → 1 through the pinned hero) and `pointer` (-1..1).
 */

import * as THREE from "three";
import { createScenePass } from "@/lib/gl/scenePass";
import { bulbFragment, bulbVertex } from "@/lib/shaders/bulbs";
import { horizonColor } from "@/lib/shaders/sky";

const PALETTE = ["#ffc93c", "#ef3b39", "#4cc35a", "#3b5bff", "#ff4fa3", "#ff7a2f"].map(c => new THREE.Color(c));
const WARM = new THREE.Color("#ffd27a");

type Bulb = { p: THREE.Vector3; color: THREE.Color; phase: number };

function makeBulbs(bulbs: Bulb[], size: number, chase: number, pixelRatio: { value: number }, time: { value: number }) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(bulbs.flatMap(b => b.p.toArray()), 3));
  geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(bulbs.flatMap(b => b.color.toArray()), 3));
  geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(bulbs.map(b => b.phase), 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: bulbVertex,
    fragmentShader: bulbFragment,
    uniforms: { uTime: time, uSize: { value: size }, uPixelRatio: pixelRatio, uChase: { value: chase } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

const metal = (color: string, emissive = 0.08) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.55, emissive: color, emissiveIntensity: emissive });

/** A cylinder between two points. */
function rod(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material) {
  const len = a.distanceTo(b);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 8), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}

export function createCarnival(opts: { coarse: boolean }) {
  const time = { value: 0 };
  const pixelRatio = { value: 1 };
  const state = { intro: 0, progress: 0, pointer: new THREE.Vector2(), enabled: true };

  // ---------------------------------------------------------------- Ferris wheel
  const R = 3.2;
  const HUB_Y = 3.9;
  const SPOKES = 16;
  const wheelRoot = new THREE.Group();
  const wheel = new THREE.Group();
  wheel.position.y = HUB_Y;
  wheelRoot.add(wheel);
  const frameMat = metal("#8f86c4", 0.03);
  const wheelBulbs: Bulb[] = [];
  for (const z of [-0.38, 0.38]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 8, 120), frameMat);
    rim.position.z = z;
    wheel.add(rim);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(R * 0.55, 0.035, 8, 80), frameMat);
    inner.position.z = z;
    wheel.add(inner);
    for (let i = 0; i < SPOKES; i++) {
      const a = (i / SPOKES) * Math.PI * 2;
      const end = new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, z);
      wheel.add(rod(new THREE.Vector3(0, 0, z), end, 0.025, frameMat));
      // bulbs down each spoke, phased outward so the light races to the rim
      for (let k = 1; k <= 7; k++) {
        const f = k / 7;
        wheelBulbs.push({ p: new THREE.Vector3(end.x * f, end.y * f, z), color: PALETTE[i % PALETTE.length], phase: f * 0.5 });
      }
    }
    for (let i = 0; i < 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      wheelBulbs.push({ p: new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, z), color: i % 2 ? WARM : PALETTE[(i >> 3) % PALETTE.length], phase: i / 128 });
    }
  }
  wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.0, 20).rotateX(Math.PI / 2), metal("#ffc93c", 0.4)));
  wheel.add(makeBulbs(wheelBulbs, 0.9, 3.2, pixelRatio, time));

  // gondolas hang from the rim and stay upright as the wheel turns
  const gondolas: THREE.Group[] = [];
  for (let i = 0; i < SPOKES; i++) {
    const a = (i / SPOKES) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    wheel.add(pivot);
    pivot.add(rod(new THREE.Vector3(0, 0, -0.38), new THREE.Vector3(0, 0, 0.38), 0.02, frameMat));
    const color = PALETTE[i % PALETTE.length];
    const cabin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.24, 0.42, 14),
      new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2, emissive: color, emissiveIntensity: 0.35 }),
    );
    cabin.position.y = -0.42;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.2, 14), metal("#fff6e5", 0.2));
    roof.position.y = -0.12;
    pivot.add(cabin, roof);
    gondolas.push(pivot);
  }

  // A-frame legs from the hub to the ground
  const legMat = metal("#6f67a8", 0.02);
  for (const z of [-0.7, 0.7]) {
    const top = new THREE.Vector3(0, HUB_Y, z * 0.6);
    wheelRoot.add(rod(top, new THREE.Vector3(-2.3, 0, z * 1.6), 0.08, legMat));
    wheelRoot.add(rod(top, new THREE.Vector3(2.3, 0, z * 1.6), 0.08, legMat));
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.25, 2.8), metal("#2b1a5c", 0.1));
  base.position.y = 0.12;
  wheelRoot.add(base);

  // ---------------------------------------------------------------- Carousel
  const carouselRoot = new THREE.Group();
  carouselRoot.position.set(-6.4, 0, 2.2);
  const carousel = new THREE.Group();
  carouselRoot.add(carousel);
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.4, 0.3, 40), metal("#ef3b39", 0.15));
  platform.position.y = 0.15;
  carousel.add(platform);
  carousel.add(rod(new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 2.6, 0), 0.32, metal("#ffc93c", 0.3)));
  // striped roof: alternate faces red / cream via vertex colours
  const roofGeo = new THREE.ConeGeometry(2.7, 1.3, 24, 1, true).toNonIndexed();
  const roofColors: number[] = [];
  const pos = roofGeo.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const tri = Math.floor(i / 6);
    const c = tri % 2 ? new THREE.Color("#fff6e5") : new THREE.Color("#ef3b39");
    roofColors.push(c.r, c.g, c.b);
  }
  roofGeo.setAttribute("color", new THREE.Float32BufferAttribute(roofColors, 3));
  const roofMesh = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide, emissive: "#ff7a2f", emissiveIntensity: 0.12 }));
  roofMesh.position.y = 3.25;
  carousel.add(roofMesh);
  const horses: THREE.Mesh[] = [];
  const carouselBulbs: Bulb[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = Math.cos(a) * 1.75;
    const z = Math.sin(a) * 1.75;
    carousel.add(rod(new THREE.Vector3(x, 0.3, z), new THREE.Vector3(x, 2.6, z), 0.03, metal("#ffd27a", 0.4)));
    const horse = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.45, 4, 10).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: PALETTE[i % PALETTE.length], roughness: 0.3, emissive: PALETTE[i % PALETTE.length], emissiveIntensity: 0.25 }));
    horse.position.set(x, 1.2, z);
    horse.rotation.y = -a;
    carousel.add(horse);
    horses.push(horse);
  }
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    carouselBulbs.push({ p: new THREE.Vector3(Math.cos(a) * 2.7, 2.6, Math.sin(a) * 2.7), color: WARM, phase: i / 72 });
  }
  for (let s = 0; s < 12; s++) {
    const a = (s / 12) * Math.PI * 2;
    for (let k = 0; k < 6; k++) {
      const f = k / 6;
      carouselBulbs.push({ p: new THREE.Vector3(Math.cos(a) * 2.7 * (1 - f), 2.6 + 1.3 * f, Math.sin(a) * 2.7 * (1 - f)), color: s % 2 ? WARM : PALETTE[0], phase: f });
    }
  }
  carousel.add(makeBulbs(carouselBulbs, 0.8, 4, pixelRatio, time));

  // ---------------------------------------------------------------- Drop tower
  const towerRoot = new THREE.Group();
  towerRoot.position.set(6.6, 0, -1.2);
  const TOWER_H = 9.5;
  towerRoot.add(rod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, TOWER_H, 0), 0.32, metal("#d8d2ff", 0.06)));
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 16), metal("#ff4fa3", 0.4));
  cap.position.y = TOWER_H + 0.45;
  towerRoot.add(cap);
  const towerBulbs: Bulb[] = [];
  for (let side = 0; side < 4; side++) {
    const a = (side / 4) * Math.PI * 2 + Math.PI / 4;
    for (let k = 0; k < 34; k++) {
      const f = k / 34;
      towerBulbs.push({ p: new THREE.Vector3(Math.cos(a) * 0.36, 0.4 + f * (TOWER_H - 0.6), Math.sin(a) * 0.36), color: side % 2 ? PALETTE[4] : PALETTE[3], phase: -f });
    }
  }
  towerRoot.add(makeBulbs(towerBulbs, 0.7, 5, pixelRatio, time));
  const carriage = new THREE.Group();
  carriage.add(new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.2, 10, 32).rotateX(Math.PI / 2), metal("#4cc35a", 0.35)));
  const carriageBulbs: Bulb[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    carriageBulbs.push({ p: new THREE.Vector3(Math.cos(a) * 1.08, 0, Math.sin(a) * 1.08), color: PALETTE[0], phase: i / 24 });
  }
  carriage.add(makeBulbs(carriageBulbs, 0.8, 8, pixelRatio, time));
  towerRoot.add(carriage);

  // ---------------------------------------------------------------- Ground & skyline
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(60, 64).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: "#150e33", roughness: 0.5, metalness: 0.4 }),
  );
  const skyline = new THREE.Group();
  // fog off: the skyline stays a dark silhouette against the glowing horizon
  const skylineMat = new THREE.MeshBasicMaterial({ color: "#0a0720", fog: false });
  const windowBulbs: Bulb[] = [];
  const rand = mulberry(7);
  for (let i = 0; i < 46; i++) {
    const a = Math.PI * (0.15 + 0.7 * (i / 46)) + (rand() - 0.5) * 0.05;
    const r = 30 + rand() * 6;
    const w = 1.5 + rand() * 2.5;
    const h = 2 + rand() * 7;
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), skylineMat);
    box.position.set(Math.cos(a) * r, h / 2, -Math.sin(a) * r);
    box.lookAt(0, h / 2, 0);
    skyline.add(box);
    const placed = new THREE.Matrix4().compose(box.position, box.quaternion, box.scale);
    const count = Math.floor(h * 1.5);
    for (let k = 0; k < count; k++) {
      if (rand() < 0.45) continue;
      const local = new THREE.Vector3((rand() - 0.5) * w * 0.8, (rand() - 0.5) * h * 0.85, w / 2 + 0.01);
      windowBulbs.push({ p: local.applyMatrix4(placed), color: WARM, phase: rand() });
    }
  }
  skyline.add(makeBulbs(windowBulbs, 0.9, 0, pixelRatio, time));

  // ---------------------------------------------------------------- Lights & scene
  const pass = createScenePass({ fov: 42, far: 120, update: frame => update(frame.time, frame.dt, frame.width / frame.height, frame.dpr) });
  const { scene, camera } = pass;
  scene.fog = new THREE.Fog("#2a1550", 14, 48);
  scene.add(wheelRoot, carouselRoot, towerRoot, ground, skyline);
  scene.add(new THREE.HemisphereLight("#8f6cff", "#1a0f30", 0.9));
  const glowA = new THREE.PointLight("#ff4fa3", 30, 14, 1.6);
  glowA.position.set(0, 1.2, 2.5);
  const glowB = new THREE.PointLight("#ffc93c", 22, 10, 1.6);
  glowB.position.set(-6.4, 1.6, 4.2);
  const glowC = new THREE.PointLight("#3b5bff", 26, 12, 1.6);
  glowC.position.set(6.6, 3, 1);
  scene.add(glowA, glowB, glowC);

  const look = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const smoothPointer = new THREE.Vector2();
  let wheelAngle = 0;
  let carouselAngle = 0;

  function update(t: number, dt: number, aspect: number, dpr: number) {
    time.value = t;
    pixelRatio.value = dpr;
    if (!state.enabled) return;

    wheelAngle += dt * 0.12;
    wheel.rotation.z = wheelAngle;
    for (const g of gondolas) g.rotation.z = -wheelAngle + Math.sin(t * 1.3 + g.position.x) * 0.06;

    carouselAngle += dt * 0.45;
    carousel.rotation.y = carouselAngle;
    horses.forEach((h, i) => { h.position.y = 1.2 + Math.sin(t * 2.2 + i * 1.3) * 0.22; });

    // drop tower: slow climb, hold at the top, drop, small bounce
    const cycle = (t % 7) / 7;
    let y: number;
    if (cycle < 0.6) y = 0.6 + (TOWER_H - 1.6) * easeInOut(cycle / 0.6);
    else if (cycle < 0.72) y = TOWER_H - 1;
    else if (cycle < 0.8) y = TOWER_H - 1 - (TOWER_H - 1.6) * Math.pow((cycle - 0.72) / 0.08, 2);
    else y = 0.6 + Math.abs(Math.sin((cycle - 0.8) * 14)) * 0.5 * (1 - (cycle - 0.8) / 0.2);
    carriage.position.y = y;

    horizonColor(state.progress, (scene.fog as THREE.Fog).color);

    // camera: arrives from high and far, then pushes toward the wheel as the hero scrolls
    smoothPointer.lerp(state.pointer, 0.05);
    const intro = easeOut(state.intro);
    const p = easeInOut(state.progress);
    const fit = aspect < 1 ? 1 / Math.max(aspect, 0.5) : 1;
    camPos.set(
      THREE.MathUtils.lerp(0, -3.4, p) + smoothPointer.x * 0.7,
      THREE.MathUtils.lerp(2.3, 4.2, p) + (1 - intro) * 7 + smoothPointer.y * 0.4,
      (THREE.MathUtils.lerp(16, 7.2, p) + (1 - intro) * 12) * (aspect < 1 ? 0.75 + 0.35 * fit : 1),
    );
    camera.position.copy(camPos);
    camera.fov = aspect < 1 ? 58 : 42;
    camera.updateProjectionMatrix();
    look.set(THREE.MathUtils.lerp(0, 0.6, p), THREE.MathUtils.lerp(3.4, HUB_Y, p), 0);
    camera.lookAt(look);
  }

  // phones: one fewer dynamic light to shade the ground with
  if (opts.coarse) scene.remove(glowC);

  return { pass, state };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

/** Small seeded random, so the skyline is the same on every visit. */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
