import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Static parts, merged into one mesh per opaque material with their world
 * transforms baked in, so hundreds of draws become a few dozen. Glass stays
 * separate, so it can sort. Anything inside `skip` (the moving rides) is left
 * alone. With `detach`, merged originals leave the tree, for a model that's
 * still drawn for what remains.
 */
export function mergeParts(root: THREE.Object3D, opts: { skip?: (o: THREE.Object3D) => boolean; detach?: boolean } = {}) {
  root.updateMatrixWorld(true);
  const byMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const parts: THREE.Mesh[] = [];
  const sources: THREE.Object3D[] = [];
  const visit = (o: THREE.Object3D) => {
    if (opts.skip?.(o)) return;
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      sources.push(mesh);
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (material.transparent) {
        const glass = new THREE.Mesh(mesh.geometry, material);
        glass.applyMatrix4(mesh.matrixWorld);
        parts.push(glass);
      } else {
        const geometry = new THREE.BufferGeometry();
        geometry.setIndex(mesh.geometry.getIndex());
        geometry.setAttribute("position", mesh.geometry.getAttribute("position").clone());
        geometry.setAttribute("normal", mesh.geometry.getAttribute("normal").clone());
        if (material.map) geometry.setAttribute("uv", mesh.geometry.getAttribute("uv").clone());
        geometry.applyMatrix4(mesh.matrixWorld);
        const list = byMaterial.get(material);
        if (list) list.push(geometry);
        else byMaterial.set(material, [geometry]);
      }
    }
    o.children.forEach(visit);
  };
  visit(root);
  byMaterial.forEach((geometries, material) => {
    const merged = mergeGeometries(geometries);
    geometries.forEach(g => g.dispose());
    if (merged) parts.push(new THREE.Mesh(merged, material));
  });
  if (opts.detach) sources.forEach(s => s.removeFromParent());
  return parts;
}
