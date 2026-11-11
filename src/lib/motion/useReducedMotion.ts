"use client";

import { useSyncExternalStore } from "react";
import { MEDIA } from "./ease";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(MEDIA.reduce);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(MEDIA.reduce).matches;
}

/** `false` on the server and during hydration, then follows the OS setting. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
