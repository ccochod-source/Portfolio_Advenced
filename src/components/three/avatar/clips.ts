export const AVATAR_CLIPS = ["Idle", "SitIdle", "Walk", "Wave", "Celebrate", "Typing"] as const;
export type AvatarClip = (typeof AVATAR_CLIPS)[number];

export const AVATAR_MODEL_URL = "/models/avatar.glb";
export const AVATAR_POSTER_URL = "/models/avatar-poster.webp";

/**
 * Ground metrics of the in-place `Walk` clip, reported by `assets/models-source/make-clips.mjs`
 * (planted-foot speed of Quaternius `Walk_Formal_Loop` retargeted onto the 1.8 m rig):
 * at time scale 1 the character covers WALK_STRIDE_M metres per WALK_CYCLE_S seconds.
 * The AvatarLayer scales the clip's playback by (ground speed / (stride / cycle)) so the feet never slide.
 */
export const WALK_STRIDE_M = 1.321;
export const WALK_CYCLE_S = 1.333;

/** Scroll storyline: 0-0.2 SitIdle, 0.2-0.6 Walk, 0.6-0.9 Idle, 0.9-1 Wave. */
export function clipForProgress(progress: number): AvatarClip {
  if (progress < 0.2) return "SitIdle";
  if (progress < 0.6) return "Walk";
  if (progress < 0.9) return "Idle";
  return "Wave";
}
