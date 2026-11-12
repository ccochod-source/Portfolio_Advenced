export const AVATAR_CLIPS = ["Idle", "SitIdle", "Walk", "Wave", "Celebrate", "Typing"] as const;
export type AvatarClip = (typeof AVATAR_CLIPS)[number];

export const AVATAR_MODEL_URL = "/models/avatar.glb";
export const AVATAR_POSTER_URL = "/models/avatar-poster.webp";

/** Scroll storyline: 0-0.2 SitIdle, 0.2-0.6 Walk, 0.6-0.9 Idle, 0.9-1 Wave. */
export function clipForProgress(progress: number): AvatarClip {
  if (progress < 0.2) return "SitIdle";
  if (progress < 0.6) return "Walk";
  if (progress < 0.9) return "Idle";
  return "Wave";
}
