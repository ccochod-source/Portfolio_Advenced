export type HeroVideoFormat = "16x9" | "9x16";

export const HERO_VIDEO_ASSETS = {
  "16x9": {
    width: 1920,
    height: 1080,
    video: "/hero/hero-zoom-16x9.mp4",
    poster: "/hero/hero-zoom-16x9.webp",
    focus: "desktop",
  },
  "9x16": {
    width: 720,
    height: 1280,
    video: "/hero/hero-zoom-9x16.mp4",
    poster: "/hero/hero-zoom-9x16.webp",
    focus: "mobile",
  },
} as const;

export function heroVideoFormatForViewport(): HeroVideoFormat {
  return window.matchMedia("(max-aspect-ratio: 1/1)").matches ? "9x16" : "16x9";
}
