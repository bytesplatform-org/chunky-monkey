/**
 * The arcade's light rig, shared by the /arcade walk and the home hero. The
 * model ships no lights: one lamp over the corridor, one over the lobby, four
 * pairs down the long room.
 */

export const LAMPS: [number, number, number][] = [
  [9.5, 3.9, 3],
  [7.2, 3.9, -7.3],
  ...[14, 19.3, 24.7, 30].flatMap((x): [number, number, number][] => [[x, 3.9, -2.5], [x, 3.9, -10]]),
];

export const LAMP = { color: "#fff1e0", intensity: 8, distance: 9, decay: 2 };
export const AMBIENT = 0.35;
export const HEMISPHERE = { sky: "#e8e4ff", ground: "#3a2d4d", intensity: 0.7 };

/** Bloom on the neon and screens, under ACES. */
export const BLOOM = { intensity: 0.45, luminanceThreshold: 0.9, luminanceSmoothing: 0.2 };

/** #14121f as it should read on screen. */
export const BACKGROUND = "#14121f";
/** The value that reads as BACKGROUND through a composer's ACES, which crushes the plain colour to black. */
export const BACKGROUND_BEFORE_ACES = "#262431";
