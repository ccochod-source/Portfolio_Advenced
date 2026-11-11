export const EASE = {
  out: "expo.out",
  inOut: "expo.inOut",
  soft: "power3.out",
  softInOut: "power2.inOut",
  linear: "none",
} as const;

export const DURATION = {
  fast: 0.45,
  base: 0.9,
  slow: 1.3,
} as const;

export const STAGGER = {
  lines: 0.09,
  words: 0.035,
  chars: 0.018,
  items: 0.08,
} as const;

export const SCROLL_START = "top 85%";

export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  fine: "(hover: hover) and (pointer: fine)",
  mobile: "(max-width: 767px)",
} as const;
