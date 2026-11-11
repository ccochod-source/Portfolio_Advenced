"use client";

import { useSyncExternalStore } from "react";

export const PRELOADER_STORAGE_KEY = "cc:preloader-seen";
const REVEAL_EVENT = "motion:page-revealed";

declare global {
  interface Window {
    /** Set by the Preloader inline script before hydration. */
    __preloader?: "active" | "done";
  }
}

/** True unless a Preloader is currently covering the page. */
export function isPageRevealed() {
  return typeof window === "undefined" || window.__preloader !== "active";
}

export function markPreloaderActive() {
  window.__preloader = "active";
}

export function markPageRevealed() {
  if (window.__preloader === "done") return;
  window.__preloader = "done";
  window.dispatchEvent(new Event(REVEAL_EVENT));
}

/** Runs `callback` now, or as soon as the preloader curtain starts lifting. Returns a canceller. */
export function whenPageRevealed(callback: () => void) {
  if (isPageRevealed()) {
    callback();
    return () => {};
  }
  window.addEventListener(REVEAL_EVENT, callback, { once: true });
  return () => window.removeEventListener(REVEAL_EVENT, callback);
}

function subscribe(onChange: () => void) {
  window.addEventListener(REVEAL_EVENT, onChange);
  return () => window.removeEventListener(REVEAL_EVENT, onChange);
}

export function usePageRevealed() {
  return useSyncExternalStore(subscribe, isPageRevealed, () => false);
}
