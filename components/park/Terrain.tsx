"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { DRACO } from "./draco";

const MODEL = "/models/terrain.glb";

/** the ground and hill meshes, once loaded, for groundHeight */
let landforms: THREE.Mesh[] = [];
const down = new THREE.Raycaster();
down.ray.direction.set(0, -1, 0);
const hits: THREE.Intersection[] = [];

/**
 * Height of the land under (x, z), or null where there's none (or it hasn't
 * loaded). The meshes opt out of pointer raycasting, so this calls the mesh
 * raycast directly.
 */
export function groundHeight(x: number, z: number): number | null {
  down.ray.origin.set(x, 500, z);
  let top: number | null = null;
  for (const mesh of landforms) {
    hits.length = 0;
    THREE.Mesh.prototype.raycast.call(mesh, down, hits);
    for (const h of hits) top = top === null ? h.point.y : Math.max(top, h.point.y);
  }
  return top;
}

/**
 * The land around the park: hills, the road out past the parking lot to the
 * village, the lake and the tree clusters. Authored in the park's own space,
 * so it sits at the origin untransformed. Shadows yes, pointer raycasting no,
 * so pointing and clicking only ever finds the park.
 */
export default function Terrain() {
  const { scene } = useGLTF(MODEL, DRACO);
  const found = useMemo(() => {
    scene.updateMatrixWorld(true);
    const found: THREE.Mesh[] = [];
    scene.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.raycast = () => {};
      if (/Terrain_(Ground|Hill)/.test(mesh.name) || /Terrain_(Ground|Hill)/.test(mesh.parent?.name ?? "")) found.push(mesh);
    });
    return found;
  }, [scene]);
  useEffect(() => {
    landforms = found;
    return () => { landforms = []; };
  }, [found]);
  return <primitive object={scene} />;
}

useGLTF.preload(MODEL, DRACO);
