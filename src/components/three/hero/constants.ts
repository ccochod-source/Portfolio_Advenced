export type Vec3Tuple = readonly [number, number, number];

/** World-space anchor of the hero set (cloud + avatar), landscape viewports — see desk.ts for the set itself. */
export const HERO_FOCUS_POSITION: Vec3Tuple = [1.35, -1.25, 0];

/** Same anchor on portrait viewports, where the camera widens: lower and closer to the centre. */
export const HERO_FOCUS_POSITION_PORTRAIT: Vec3Tuple = [0.9, -2.1, 0];

export const heroFocusFor = (aspect: number): Vec3Tuple => (aspect < 1 ? HERO_FOCUS_POSITION_PORTRAIT : HERO_FOCUS_POSITION);

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

/** Drifting cloud billboards per layer (far, mid, near). */
export const CLOUD_COUNT = { desktop: [7, 6, 6, 5, 3], mobile: [4, 3, 3, 3, 2] } as const;
/** Equirectangular golden-hour sky (Poly Haven "Kloppenheim 06 (Pure Sky)", CC0, warm-graded — see public/models/LICENSE.md). */
export const SKY_TEXTURE_URL = "/textures/sky-golden-hour.webp";
export const CLOUD_TEXTURE_URLS = ["/textures/cloud-1.webp", "/textures/cloud-2.webp", "/textures/cloud-3.webp"] as const;
