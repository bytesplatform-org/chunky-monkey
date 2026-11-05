import * as THREE from "three";

/** Grid points along each side: coarse, then smoothed by linear filtering into a continuous flow. */
const SIZE = 32;
/** How far round the cursor a drag reaches, in grid cells. */
const REACH = 7;
/** How much of the cursor's travel the photo takes up. */
const GAIN = 0.9;
/** The furthest the photo strays, as a share of the frame. */
const MAX_FLOW = 0.12;
/** How quickly the flow dies away (per second): thick liquid, not water. */
const SETTLE = 2.4;
/** Below this, the flow has stopped. */
const AT_REST = 0.0005;

/**
 * A smooth 2D flow over a photo, kept in a small texture. The cursor drags the
 * flow along its direction of travel, and it dies away on its own.
 */
export function createLiquidField() {
  const data = new Float32Array(SIZE * SIZE * 2);
  const texture = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGFormat, THREE.FloatType);
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  let moving = false;

  return {
    texture,
    get moving() { return moving; },
    /** Drags the flow round (x, y) by (dx, dy), as shares of the frame, y up. `aspect` keeps the reach round. */
    drag(x: number, y: number, dx: number, dy: number, aspect: number) {
      const sx = Math.max(1, aspect);
      const sy = Math.max(1, 1 / aspect);
      for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
          const dist = Math.hypot((col + 0.5 - x * SIZE) * sx, (row + 0.5 - y * SIZE) * sy);
          if (dist >= REACH) continue;
          const fall = (1 - dist / REACH) ** 2;
          const i = (row * SIZE + col) * 2;
          data[i] = THREE.MathUtils.clamp(data[i] + dx * GAIN * fall, -MAX_FLOW, MAX_FLOW);
          data[i + 1] = THREE.MathUtils.clamp(data[i + 1] + dy * GAIN * fall, -MAX_FLOW, MAX_FLOW);
        }
      }
      moving = true;
    },
    /** Lets the flow die away by `dt` seconds. */
    settle(dt: number) {
      if (!moving) return;
      const keep = Math.exp(-SETTLE * dt);
      moving = false;
      for (let i = 0; i < data.length; i++) {
        data[i] *= keep;
        if (Math.abs(data[i]) < AT_REST) data[i] = 0;
        else moving = true;
      }
      texture.needsUpdate = true;
    },
    /** Stills the flow at once. */
    reset() {
      data.fill(0);
      moving = false;
      texture.needsUpdate = true;
    },
    dispose() {
      texture.dispose();
    },
  };
}
