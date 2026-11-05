/**
 * The hero's models, each downloaded once and shared: the preloader counts
 * their progress, the hero builds the walk from them.
 */

import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { DRACO } from "@/components/park/draco";

const FILES = { arcade: "/models/arcade.glb", park: "/models/park.glb", terrain: "/models/terrain.glb" };

export type HeroModels = Record<keyof typeof FILES, GLTF>;

const promises = new Map<string, Promise<GLTF>>();
/** bytes loaded and total, per file */
const bytes = new Map<string, { loaded: number; total: number }>();
const listeners = new Set<(fraction: number) => void>();

const fraction = () => {
  let loaded = 0, total = 0;
  bytes.forEach(b => { loaded += b.loaded; total += b.total; });
  // until every file has reported its size, the total is too small to trust
  return bytes.size < Object.keys(FILES).length || !total ? 0 : loaded / total;
};
const report = () => listeners.forEach(l => l(fraction()));

function load(url: string): Promise<GLTF> {
  const started = promises.get(url);
  if (started) return started;
  const draco = new DRACOLoader().setDecoderPath(DRACO);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const promise = new Promise<GLTF>((resolve, reject) => {
    loader.load(
      url,
      gltf => {
        draco.dispose();
        resolve(gltf);
      },
      xhr => {
        if (!xhr.total) return;
        bytes.set(url, { loaded: xhr.loaded, total: xhr.total });
        report();
      },
      error => {
        draco.dispose();
        reject(error);
      },
    );
  });
  promises.set(url, promise);
  // a failed download may be retried by the next caller
  promise.catch(() => { promises.delete(url); });
  return promise;
}

/** The room alone, for the still hero of reduced motion. */
export const loadArcade = () => load(FILES.arcade);

export async function loadHeroModels(): Promise<HeroModels> {
  const [arcade, park, terrain] = await Promise.all([load(FILES.arcade), load(FILES.park), load(FILES.terrain)]);
  return { arcade, park, terrain };
}

/** Calls back with download progress 0..1 (at once with the current value). Returns the unsubscribe. */
export function onHeroProgress(listener: (fraction: number) => void): () => void {
  listeners.add(listener);
  listener(fraction());
  return () => { listeners.delete(listener); };
}
