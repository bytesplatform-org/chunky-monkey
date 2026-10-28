/**
 * A regular Three.js 3D scene as a stage pass: a Scene plus a perspective
 * camera kept at the canvas aspect. Put meshes in `scene`, animate them in
 * `update` (or from GSAP), and the stage draws it each frame.
 */

import * as THREE from "three";
import type { Frame, Pass } from "./stage";

export type ScenePass = Pass & {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
};

export function createScenePass(opts: {
  fov?: number;
  near?: number;
  far?: number;
  /** runs before each draw */
  update?(frame: Frame): void;
} = {}): ScenePass {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 45, 1, opts.near ?? 0.1, opts.far ?? 100);
  camera.position.set(0, 0, 6);

  return {
    scene,
    camera,
    resize(width, height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render(renderer, frame) {
      opts.update?.(frame);
      renderer.clearDepth();
      renderer.render(scene, camera);
    },
    dispose() {
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => material.dispose());
      });
    },
  };
}
