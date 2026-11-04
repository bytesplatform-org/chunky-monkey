/**
 * The walk's rules, free of React: where it starts, how fast it goes, the
 * space the camera may be in, and the input the page feeds it each frame.
 */

export const SPAWN = { position: [9.5, 1.65, 5] as const, yaw: 0, pitch: 0 };

export const SPEED = { min: 0.5, max: 8, initial: 3, fast: 3, slow: 0.3 };

/** ±85° of look up and down */
export const MAX_PITCH = (85 * Math.PI) / 180;

/** Inside the building, plus a slot through the exit door out onto the steps. */
const BOUNDS = { x: [0.3, 31.7], y: [0.4, 3.9], z: [-14.3, 5.7] };
const DOOR = { z: [-5.05, -2.45], x: 36 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Keeps a move inside the bounds. The wall at x 31.7 only opens at the door;
 * once out through it, the door's jambs hold z instead, so the walk can't
 * slide along the outside of the building.
 */
export function confine(from: { x: number }, to: { x: number; y: number; z: number }) {
  to.y = clamp(to.y, BOUNDS.y[0], BOUNDS.y[1]);
  to.z = clamp(to.z, BOUNDS.z[0], BOUNDS.z[1]);
  to.x = clamp(to.x, BOUNDS.x[0], DOOR.x);
  if (to.x <= BOUNDS.x[1]) return;
  if (from.x > BOUNDS.x[1]) to.z = clamp(to.z, DOOR.z[0], DOOR.z[1]);
  else if (to.z < DOOR.z[0] || to.z > DOOR.z[1]) to.x = BOUNDS.x[1];
}

/** What the page's keys, mouse and touch controls hand the camera rig. */
export type WalkInput = {
  /** keys held, by KeyboardEvent.code */
  keys: Set<string>;
  /** the joystick: x right, y forward, each -1..1 */
  stick: { x: number; y: number };
  /** look movement since the last frame, in radians */
  look: { yaw: number; pitch: number };
  /** the speed the wheel has set, m/s */
  speed: number;
  /** a request to go back to the spawn */
  reset: boolean;
};

export const newInput = (): WalkInput => ({
  keys: new Set(),
  stick: { x: 0, y: 0 },
  look: { yaw: 0, pitch: 0 },
  speed: SPEED.initial,
  reset: false,
});

/** m/s for the speed set on the wheel and the modifiers held. */
export const speedWith = (speed: number, keys: Set<string>) =>
  speed * (keys.has("ShiftLeft") || keys.has("ShiftRight") ? SPEED.fast : 1) * (keys.has("AltLeft") || keys.has("AltRight") ? SPEED.slow : 1);
