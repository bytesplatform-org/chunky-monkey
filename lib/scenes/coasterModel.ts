/**
 * The coaster model, downloaded once and shared: the preloader counts its
 * progress, the hero builds the ride from it. Both call loadCoaster(); the
 * second caller gets the same promise.
 */

import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const MODEL_URL = "/media/coaster.glb";

let promise: Promise<GLTF> | null = null;
let fraction = 0;
const listeners = new Set<(fraction: number) => void>();

export function loadCoaster(): Promise<GLTF> {
  if (!promise) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    promise = new Promise<GLTF>((resolve, reject) => {
      loader.load(
        MODEL_URL,
        gltf => {
          fraction = 1;
          listeners.forEach(l => l(1));
          resolve(gltf);
        },
        xhr => {
          if (!xhr.total) return;
          fraction = xhr.loaded / xhr.total;
          listeners.forEach(l => l(fraction));
        },
        reject,
      );
    });
    // a failed download may be retried by the next caller
    promise.catch(() => { promise = null; });
  }
  return promise;
}

/** Calls back with download progress 0..1 (at once with the current value). Returns the unsubscribe. */
export function onCoasterProgress(listener: (fraction: number) => void): () => void {
  listeners.add(listener);
  listener(fraction);
  return () => { listeners.delete(listener); };
}
