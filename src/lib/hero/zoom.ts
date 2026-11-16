/**
 * Tiny store shared between the pinned hero (DOM, GSAP ScrollTrigger) and the hero Canvas:
 * HeroZoom writes the pin progress (0 = hero composition, 1 = the laptop screen fills the viewport),
 * CameraRig / ScreenContent / AvatarLayer read it each frame.
 */
const state = { progress: 0 };
const listeners = new Set<(progress: number) => void>();

export function setZoomProgress(progress: number) {
  const next = Math.min(1, Math.max(0, progress));
  if (next === state.progress) return;
  state.progress = next;
  listeners.forEach((listener) => listener(next));
}

export function getZoomProgress() {
  return state.progress;
}

/** Subscribe to progress changes (React state, not per-frame reads). Returns the unsubscribe function. */
export function subscribeZoom(listener: (progress: number) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Scroll thresholds of the zoom, as fractions of the pin progress. */
export const ZOOM = {
  /** Scroll distance of the pin, in viewport heights. */
  pinLength: { desktop: 1.5, mobile: 1 },
  /** Hero copy (wordmark, tagline, CTAs) fades out over this range. */
  copyFadeEnd: 0.3,
  /** Camera: dolly + orbit toward the screen until here, then straight zoom into it. */
  orbitEnd: 0.6,
  /** Crossfade from the 3D screen to the real DOM (manifesto) over this range. */
  handoverStart: 0.85,
  /** Lid back: the painted page is revealed through the aluminium over this range (the camera is closing in). */
  reveal: { start: 0.42, end: 0.7 },
  /** Screen texture: the laptop grid/glare fade out over this range, leaving the plain page. */
  screenChromeFade: { start: 0.55, end: 0.85 },
  /**
   * Screen texture: the painted page sits where the real manifesto is (so the handover is exact), scaled by
   * `far` while the camera is still far (`p < from`) so the headline shows up on the screen earlier.
   */
  pageSlide: { far: 0.55, from: 0.6, to: 0.85 },
} as const;

export const VIDEO_ZOOM = {
  pinLength: { desktop: 2.2, mobile: 1.6 },
  scrubEnd: 0.78,
  focus: {
    desktop: { origin: [0.4674, 0.5301], scale: 2.5 },
    mobile: { origin: [0.5, 0.46], scale: 2.3 },
  },
} as const;

/** `data-zoom-page` marks the DOM block the screen texture mirrors (the manifesto stage). */
export const ZOOM_PAGE_ATTR = "data-zoom-page";
