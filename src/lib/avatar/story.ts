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

/** Every DOM element the storyline is measured against (anchors first, then landmarks without an anchor). */
export const AVATAR_TARGETS = {
  hero: `[data-avatar-anchor="${AVATAR_ANCHORS.hero}"]`,
  band: `[data-avatar-anchor="${AVATAR_ANCHORS.band}"]`,
  journey: `[data-avatar-anchor="${AVATAR_ANCHORS.journey}"]`,
  /** Top rule of the timeline: the ground the avatar stands on next to the journey. */
  journeyTrack: "#journey-track",
  /** Contact headline in the footer: the avatar celebrates next to it. */
  contact: "#contact h2",
} as const;

export type AvatarSegment =
  | "hero"
  | "heroExit"
  | "band"
  | "bandExit"
  | "journeyEnter"
  | "journey"
  | "journeyExit"
  | "contactEnter"
  | "contact"
  | "none";

/**
 * Scroll thresholds of the storyline, as fractions of the viewport height (H) or of a segment's own progress.
 * Every segment starts where the previous one ends so the target pose is continuous along the scroll.
 */
export const STORY = {
  hero: {
    /** Hero exit progress (0 = hero fully visible, 1 = hero scrolled out) at which the avatar stands up / sits back. */
    standUp: 0.22,
    sitDown: 0.16,
    /** Exit progress range of the walk from the sun down to the manifesto band (desktop). */
    walkStart: 0.3,
    walkEnd: 0.95,
    /** Exit progress range of the fade-out on narrow screens (no walk, the band is too far below). */
    fadeStart: 0.45,
    fadeEnd: 0.6,
  },
  band: {
    /** Pin progress range covered by the walk across the band (the rest is settling time). */
    walkFrom: 0.04,
    walkTo: 0.94,
    /** Narrow screens (no pin): the walk is driven by the band's bottom edge moving from 0.78H up to 0.32H (the hero has faded out by then). */
    narrowFrom: 0.78,
    narrowTo: 0.32,
    /** Vertical distance (in H) the band travels after the pin while the avatar walks off the right edge. */
    exitTravel: 0.3,
    narrowExitTo: 0.13,
  },
  journey: {
    /** Timeline rule position (in H) where the avatar starts / finishes walking in from the right. */
    enterFrom: 1.02,
    enterTo: 0.68,
    /** Rule position (in H) where it walks back off the right edge (long enough a stay for the wave to play out). */
    exitFrom: 0.3,
    exitTo: 0.12,
  },
  contact: {
    /** Footer top (in H) where the avatar walks in from the right / is settled next to the headline. */
    enterFrom: 0.78,
    enterTo: 0.42,
    /** Narrow screens: fade range (footer top in H). */
    narrowFadeFrom: 0.75,
    narrowFadeTo: 0.55,
  },
} as const;
