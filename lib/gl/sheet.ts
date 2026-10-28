/**
 * The sheet's geometry — pure layout math, no rendering.
 *
 * The sheet travels from the start rect (the card) to the end rect (the
 * panel). Each corner follows its own delayed curve, so mid-transition the
 * card is pulled out of shape — the top-right corner leads, the bottom-left
 * lags — instead of scaling as a rigid box.
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type V2 = [number, number];

/** per-corner delay (TL, TR, BR, BL) as a fraction of the transition */
export const CORNER_DELAY = [0.12, 0.0, 0.2, 0.3] as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function cornersOf(r: Rect): V2[] {
  return [
    [r.x, r.y],
    [r.x + r.w, r.y],
    [r.x + r.w, r.y + r.h],
    [r.x, r.y + r.h],
  ];
}

/** the four corners at progress t — exact start rect at 0, exact end rect at 1 */
export function cornersAt(from: Rect, to: Rect, t: number): V2[] {
  const a = cornersOf(from);
  const b = cornersOf(to);
  const span = 1 - Math.max(...CORNER_DELAY);
  // Translate the sheet as a whole. Delaying its travel per corner can
  // collapse/invert the surface when the destination is below the card.
  const top = from.y + (to.y - from.y) * easeInOut(clamp01(t));
  return a.map(([x0, y0], i) => {
    const e = easeInOut(clamp01((t - CORNER_DELAY[i]) / span));
    const localY = y0 - from.y;
    const targetY = b[i][1] - to.y;
    return [x0 + (b[i][0] - x0) * e, top + localY + (targetY - localY) * e];
  });
}

/** the sheet's current size: the mean length of its opposite edges */
export function sizeOf([c0, c1, c2, c3]: V2[]): V2 {
  const len = (p: V2, q: V2) => Math.hypot(q[0] - p[0], q[1] - p[1]);
  return [(len(c0, c1) + len(c3, c2)) / 2, (len(c0, c3) + len(c1, c2)) / 2];
}
