import { Vector3 } from "three";
import { HERO_FOCUS_POSITION, HERO_FOCUS_POSITION_PORTRAIT, type Vec3Tuple } from "./constants";

/**
 * Contract between the desk set (DeskScene: chair, desk, MacBook, seated avatar) and the camera
 * zoom-into-the-screen transition. Both read these constants; only change them together.
 * Units: metres, world space of the hero Canvas (camera on +Z looking at the origin).
 */

/** Floor point under the chair, landscape viewports (same anchor the hero focus used). */
export const DESK_ORIGIN: Vec3Tuple = [HERO_FOCUS_POSITION[0], HERO_FOCUS_POSITION[1] - 0.35, 0];
/** Same on portrait viewports. */
export const DESK_ORIGIN_PORTRAIT: Vec3Tuple = [HERO_FOCUS_POSITION_PORTRAIT[0], HERO_FOCUS_POSITION_PORTRAIT[1] - 0.35, 0];
export const deskOriginFor = (aspect: number): Vec3Tuple => (aspect < 1 ? DESK_ORIGIN_PORTRAIT : DESK_ORIGIN);

/** Yaw of the whole set around +Y: the avatar sits facing the laptop; the camera sees a 3/4 view with the screen face visible. */
export const DESK_YAW = -0.75;

/** Desk-top height above DESK_ORIGIN. */
export const DESK_TOP_HEIGHT = 0.74;

/** MacBook screen (open at ~110°), expressed in the set's local space (before DESK_YAW), origin = DESK_ORIGIN. */
export const SCREEN_CENTER_LOCAL: Vec3Tuple = [0, DESK_TOP_HEIGHT + 0.16, -0.22];
export const SCREEN_SIZE = { width: 0.3, height: 0.195 } as const;
/** Unit normal of the screen face in local space (points toward the viewer side, i.e. away from the avatar). */
export const SCREEN_NORMAL_LOCAL: Vec3Tuple = [0, 0.34, 0.94];

/** World-space screen centre and normal for a given viewport aspect — the camera dolly target. */
export function getScreenWorld(aspect: number) {
  const origin = deskOriginFor(aspect);
  const center = new Vector3(...SCREEN_CENTER_LOCAL).applyAxisAngle(new Vector3(0, 1, 0), DESK_YAW).add(new Vector3(...origin));
  const normal = new Vector3(...SCREEN_NORMAL_LOCAL).normalize().applyAxisAngle(new Vector3(0, 1, 0), DESK_YAW);
  return { center, normal };
}
