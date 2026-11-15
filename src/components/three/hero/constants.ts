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

/** Warm photo-cloud billboards per layer (mid, near). */
export const CLOUD_COUNT = { desktop: [2, 1], mobile: [1, 1] } as const;
/** Equirectangular golden-hour sky used as the hero scene environment light. */
export const SKY_TEXTURE_URL = "/textures/sky-golden-hour.webp";
export const HERO_SKY_URL = "/textures/hero-sky.webp";
export const HERO_SKY_PORTRAIT_URL = "/textures/hero-sky-portrait.webp";
export const CLOUD_PHOTO_URLS = ["/textures/cloud-photo-wide.webp", "/textures/cloud-photo-tall.webp"] as const;
