/**
 * Per-frame state of the Selected Work gallery, shared by the DOM controller (scroll, drag, keys) and the
 * WebGL scene. Plain mutable object: written from event handlers / tickers, read in `useFrame`.
 */
export const gallery = {
  count: 0,
  /** Float project index requested by scroll / drag (0 … count - 1). */
  target: 0,
  /** Smoothed index the panels are drawn at. */
  current: 0,
  /** `current` plus the intro spin-in offset: the index sitting in the centre of the screen. */
  display: 0,
  /** Smoothed `current` velocity, in projects per second. */
  velocity: 0,
  /** 0 → 1 while the stage scrolls into the viewport. */
  intro: 0,
  /** Panel under the pointer (-1 when none). */
  hover: -1,
  dragging: false,
  expand: { index: -1, progress: 0 },
};

export function resetGalleryExpand() {
  gallery.expand.index = -1;
  gallery.expand.progress = 0;
}

const INTRO_SHIFT = 1.8;

/** Advances the smoothing by `dt` seconds. */
export function stepGallery(dt: number) {
  const prev = gallery.current;
  const k = 1 - Math.exp(-dt * (gallery.dragging ? 14 : 9));
  gallery.current += (gallery.target - gallery.current) * k;
  if (Math.abs(gallery.target - gallery.current) < 1e-4) gallery.current = gallery.target;
  const raw = dt > 0 ? (gallery.current - prev) / dt : 0;
  gallery.velocity += (raw - gallery.velocity) * (1 - Math.exp(-dt * 10));
  if (Math.abs(gallery.velocity) < 1e-3) gallery.velocity = 0;
  const intro = 1 - Math.pow(1 - gallery.intro, 3);
  gallery.display = gallery.current - (1 - intro) * INTRO_SHIFT;
}
