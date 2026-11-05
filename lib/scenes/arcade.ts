/**
 * The hero's walk as a stage pass: the arcade and, once the walk needs it, the
 * park outside. They're two scenes drawn into one depth buffer, so each keeps
 * its own light: the room stays night through a door full of daylight. Each is
 * skipped when it can't be seen. Set `state.target` (scroll progress, 0..1) and
 * the camera eases after it, with a small tilt toward the cursor on top.
 *
 * Bloom needs a composer, which is too much for phones: on touch screens the
 * scenes draw straight to the stage, under ACES, without it or shadows.
 */

import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import type { Pass } from "@/lib/gl/stage";
import { isCoarsePointer } from "@/lib/animation/prefs";
import { AMBIENT, BACKGROUND, BACKGROUND_BEFORE_ACES, BLOOM, HEMISPHERE, LAMP, LAMPS } from "./arcadeLights";
import { DOOR_IN_VIEW_X, LEFT_ARCADE_X, placeCamera } from "./arcadePath";
import type { HeroModels } from "./heroModels";
import { mergeParts } from "./mergeParts";
import { createParkOutside } from "./parkOutside";
import { lensAt, parkTour } from "./parkTour";

/** The lens (vertical degrees), and the narrowest aspect it still covers without widening. */
const FOV = 65;
const MIN_ASPECT = 1.2;

/** How quickly the camera catches up with the scrubbed target (per second). */
const FOLLOW = 6;

/** The drone tour, as on /park: its long lens, widest on narrow screens, and its slower catch-up. */
const TOUR = { fov: 40, maxFov: 72, follow: 4, near: 0.5, far: 900 };
const WALK_CLIP = { near: 0.05, far: 140 };

/** The lens that keeps the width a `fov` lens shows at MIN_ASPECT, on a narrower screen. */
const fitted = (fov: number, aspect: number, max: number) =>
  aspect >= MIN_ASPECT ? fov : Math.min(max, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) * (MIN_ASPECT / aspect))));

/** The cursor eases the camera off its path: a look toward it plus a few centimetres of drift. */
const TILT = { yaw: 2.2, pitch: 1.4, shift: 0.07, damping: 1.9 };

/** Pass the park and the land for the whole walk; the room alone holds the still hero. */
const disposeMesh = (o: THREE.Object3D) => {
  const mesh = o as THREE.Mesh;
  if (!mesh.isMesh) return;
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
};

export function createArcade(models: { arcade: GLTF } & Partial<Omit<HeroModels, "arcade">>, opts: { tilt: boolean }) {
  const state = { target: 0, p: 0 };
  const bloom = !isCoarsePointer();

  const scene = new THREE.Scene();
  const background = new THREE.Color(bloom ? BACKGROUND_BEFORE_ACES : BACKGROUND);
  mergeParts(models.arcade.scene).forEach(part => scene.add(part));
  scene.add(new THREE.AmbientLight("#ffffff", AMBIENT));
  scene.add(new THREE.HemisphereLight(HEMISPHERE.sky, HEMISPHERE.ground, HEMISPHERE.intensity));
  for (const position of LAMPS) {
    const lamp = new THREE.PointLight(LAMP.color, LAMP.intensity, LAMP.distance, LAMP.decay);
    lamp.position.set(...position);
    scene.add(lamp);
  }

  const camera = new THREE.PerspectiveCamera(FOV, 1, WALK_CLIP.near, WALK_CLIP.far);
  let walkFov = FOV;
  let tourFov = TOUR.fov;
  let touring = false;
  let tourP = 0;

  const outside = models.park && models.terrain
    ? createParkOutside(models.park, models.terrain, { composer: bloom, shadows: bloom })
    : null;

  let composer: EffectComposer | null = null;
  let bloomEffect: BloomEffect | null = null;
  let outsidePass: RenderPass | null = null;
  let arcadePass: RenderPass | null = null;

  const pointer = { x: 0, y: 0 }; // target, -1..1, y up
  const tilt = { x: 0, y: 0 }; //    eased
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / innerHeight) * 2 - 1);
  };
  const onPointerLeave = () => { pointer.x = pointer.y = 0; };
  if (opts.tilt) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
  }

  const pass: Pass = {
    resize(width, height) {
      camera.aspect = width / height;
      // tall screens: widen the lens so the room's width stays in frame
      walkFov = fitted(FOV, camera.aspect, 85);
      tourFov = fitted(TOUR.fov, camera.aspect, TOUR.maxFov);
      camera.fov = walkFov;
      camera.updateProjectionMatrix();
      composer?.setSize(width, height, false);
    },
    render(renderer, frame) {
      const wantTour = !!outside && parkTour.active;
      if (wantTour !== touring) {
        touring = wantTour;
        if (touring) tourP = parkTour.target;
        outside?.cutAtDoor(!touring);
        camera.near = touring ? TOUR.near : WALK_CLIP.near;
        camera.far = touring ? TOUR.far : WALK_CLIP.far;
        camera.fov = walkFov;
        camera.updateProjectionMatrix();
      }
      tilt.x = THREE.MathUtils.damp(tilt.x, pointer.x, TILT.damping, frame.dt);
      tilt.y = THREE.MathUtils.damp(tilt.y, pointer.y, TILT.damping, frame.dt);
      if (touring) {
        tourP += (parkTour.target - tourP) * (1 - Math.exp(-TOUR.follow * frame.dt));
        outside!.tour.place(camera, tourP);
        camera.fov = THREE.MathUtils.lerp(walkFov, tourFov, lensAt(tourP));
        camera.updateProjectionMatrix();
      } else {
        state.p += (state.target - state.p) * (1 - Math.exp(-FOLLOW * frame.dt));
        placeCamera(camera, state.p);
      }
      camera.translateX(tilt.x * TILT.shift);
      camera.translateY(tilt.y * TILT.shift);
      camera.rotateY(-tilt.x * THREE.MathUtils.degToRad(TILT.yaw));
      camera.rotateX(tilt.y * THREE.MathUtils.degToRad(TILT.pitch));

      const x = camera.position.x;
      const drawOutside = !!outside && (touring || x > DOOR_IN_VIEW_X);
      const drawArcade = !touring && (!outside || x < LEFT_ARCADE_X);
      if (drawOutside) outside.update(frame);
      // whichever draws first owns the clear and the background; with the park behind it, the room has neither
      scene.background = drawOutside ? null : background;

      if (bloom) {
        if (!composer) {
          // the shadow map is the page's only one, and the outside scene the only one to use it
          renderer.shadowMap.enabled = !!outside;
          renderer.localClippingEnabled = !!outside;
          composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: 4 });
          if (outside) composer.addPass(outsidePass = new RenderPass(outside.scene, camera));
          composer.addPass(arcadePass = new RenderPass(scene, camera));
          bloomEffect = new BloomEffect({ mipmapBlur: true, ...BLOOM });
          // three skips the renderer's tone mapping inside a composer, so ACES is an effect here, after the bloom
          composer.addPass(new EffectPass(camera, bloomEffect, new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })));
          composer.setSize(frame.width, frame.height, false);
        }
        if (outsidePass) outsidePass.enabled = drawOutside;
        arcadePass!.enabled = drawArcade;
        arcadePass!.clearPass.enabled = !drawOutside;
        // daylight is far over the threshold that picks out neon: bloom is for indoors
        bloomEffect!.intensity = touring ? 0 : BLOOM.intensity * (1 - THREE.MathUtils.smoothstep(x, 32, 38));
        composer.render(frame.dt);
        return;
      }
      renderer.localClippingEnabled = !!outside;
      const toneMapping = renderer.toneMapping;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.clearDepth();
      if (drawOutside) renderer.render(outside.scene, camera);
      if (drawArcade) renderer.render(scene, camera);
      renderer.toneMapping = toneMapping;
    },
    dispose() {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      composer?.dispose();
      outside?.dispose();
      outside?.scene.traverse(disposeMesh);
      scene.traverse(disposeMesh);
    },
  };

  return { pass, state };
}
