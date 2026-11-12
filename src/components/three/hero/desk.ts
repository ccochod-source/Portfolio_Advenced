import { Vector3 } from "three";
import { HERO_FOCUS_POSITION, HERO_FOCUS_POSITION_PORTRAIT, type Vec3Tuple } from "./constants";

/**
 * Contract between the hero set (DeskScene: cloud seat, seated avatar, MacBook open on his lap) and the camera
 * zoom-into-the-screen transition. Both read these constants; only change them together.
 * Units: metres, world space of the hero Canvas (camera on +Z looking at the origin).
 * Set local space: the avatar faces +Z, feet at y = 0, before DESK_YAW / deskScaleFor are applied.
 */

/** "Floor" point of the set (under the avatar's feet, on the cloud), landscape viewports: lower-centre/right, the upper-centre stays free for the wordmark. */
export const DESK_ORIGIN: Vec3Tuple = [HERO_FOCUS_POSITION[0] - 0.2, HERO_FOCUS_POSITION[1] - 0.55, 0];
/** Same on portrait viewports (the camera widens, see CameraRig). */
export const DESK_ORIGIN_PORTRAIT: Vec3Tuple = [HERO_FOCUS_POSITION_PORTRAIT[0] - 0.3, HERO_FOCUS_POSITION_PORTRAIT[1] - 0.3, 0];
export const deskOriginFor = (aspect: number): Vec3Tuple => (aspect < 1 ? DESK_ORIGIN_PORTRAIT : DESK_ORIGIN);

/** Uniform scale of the whole set: enlarged on portrait viewports where the camera frustum is much wider. */
export const DESK_SCALE = 1.15;
export const DESK_SCALE_PORTRAIT = 1.45;
export const deskScaleFor = (aspect: number): number => (aspect < 1 ? DESK_SCALE_PORTRAIT : DESK_SCALE);

/** Yaw of the whole set around +Y: the avatar faces the camera in a 3/4 view, turned towards the centre of the viewport. */
export const DESK_YAW = -0.55;

/** Lap height above DESK_ORIGIN: top face of the MacBook base resting on the thighs (keys sit ~1 cm above). */
export const DESK_TOP_HEIGHT = 0.62;

/** Hinge of the MacBook (far edge of the base, at the knees), set local space. */
export const LAPTOP_HINGE_LOCAL: Vec3Tuple = [0, DESK_TOP_HEIGHT + 0.006, 0.42];
/** Lid opening: 110° from the base, i.e. the lid leans 20° back (towards the knees / +Z). */
export const LAPTOP_LID_TILT = 0.349;

/** MacBook screen centre, set local space, origin = DESK_ORIGIN (hinge + half the lid height along the tilted lid). */
export const SCREEN_CENTER_LOCAL: Vec3Tuple = [
  0,
  LAPTOP_HINGE_LOCAL[1] + 0.1075 * Math.cos(LAPTOP_LID_TILT),
  LAPTOP_HINGE_LOCAL[2] + 0.1075 * Math.sin(LAPTOP_LID_TILT),
];
export const SCREEN_SIZE = { width: 0.3, height: 0.195 } as const;
/**
 * Unit normal of the screen face in local space: it points at the avatar's face (-Z, tilted up), as a real laptop on
 * the lap does. The camera (+Z) therefore sees the aluminium back of the lid in 3/4 view, like codeofsagar.in.
 */
export const SCREEN_NORMAL_LOCAL: Vec3Tuple = [0, Math.sin(LAPTOP_LID_TILT), -Math.cos(LAPTOP_LID_TILT)];

/** World-space screen centre and normal for a given viewport aspect — the camera dolly target. */
export function getScreenWorld(aspect: number) {
  const origin = deskOriginFor(aspect);
  const scale = deskScaleFor(aspect);
  const center = new Vector3(...SCREEN_CENTER_LOCAL)
    .multiplyScalar(scale)
    .applyAxisAngle(new Vector3(0, 1, 0), DESK_YAW)
    .add(new Vector3(...origin));
  const normal = new Vector3(...SCREEN_NORMAL_LOCAL).normalize().applyAxisAngle(new Vector3(0, 1, 0), DESK_YAW);
  return { center, normal, scale };
}
