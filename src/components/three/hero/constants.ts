/** World-space position of the luminous "sun / neural" form where the avatar will sit. */
export const HERO_FOCUS_POSITION = [0.85, -1.25, 0] as const;

export type Vec3Tuple = readonly [number, number, number];

export const HERO_CAMERA_Z = 6;

export const PALETTE = {
  cream: "#fff4e6",
  creamDeep: "#ffe4c4",
  gold: "#ffc145",
  sun: "#ff7a1a",
  coral: "#ff5a4e",
  inkSoft: "#6b4a3a",
  ink: "#2b1a12",
} as const;

export const PARTICLE_COUNT = { desktop: 1500, mobile: 400 } as const;
