/**
 * Tiny store shared between the DOM sections and the single avatar canvas:
 * the manifesto Pin writes its scroll progress here, the AvatarLayer reads it each frame.
 */
const state = { manifestoProgress: 0 };

export function setManifestoProgress(progress: number) {
  state.manifestoProgress = progress;
}

export function getManifestoProgress() {
  return state.manifestoProgress;
}

/** `data-avatar-anchor` values the AvatarLayer looks for in the DOM. */
export const AVATAR_ANCHORS = {
  hero: "hero",
  band: "band",
  journey: "journey",
} as const;
