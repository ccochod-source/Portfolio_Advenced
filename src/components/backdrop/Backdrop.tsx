"use client";

import { useEffect, useRef } from "react";
import { ZOOM, getZoomProgress, subscribeZoom } from "@/lib/hero/zoom";
import { Enso, Lotus, Mandala, Unalome } from "./symbols";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** 0 → 1 while the hero zoom hands over to the manifesto (0 whenever the zoom is not running). */
function zoomFade(progress: number) {
  return clamp01((progress - ZOOM.handoverStart) / (1 - ZOOM.handoverStart));
}

/** 0 → 1 as the (unpinned) hero leaves the viewport: the no-zoom path (reduced motion, no WebGL). */
function scrollFade(hero: HTMLElement | null) {
  if (!hero) return 1;
  const bottom = hero.getBoundingClientRect().bottom;
  return clamp01((window.innerHeight - bottom) / (window.innerHeight * 0.5));
}

/** 0 at the top of the page → 1 at the bottom: the light gets warmer toward the journey / contact. */
function pageWarmth() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? clamp01(window.scrollY / max) : 0;
}

/**
 * Ambient golden-hour light behind the cream sections: fixed, full-viewport, under every section
 * (`z-index: -1`), never catches the pointer. Fades in as the hero zoom finishes, warms up with page depth,
 * stays still with `prefers-reduced-motion`, and pauses while the tab is hidden.
 */
export function Backdrop() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const hero = document.getElementById("hero");
    let frame = 0;
    let lastFade = -1;
    let lastWarmth = -1;

    const paint = () => {
      frame = 0;
      const fade = Math.max(zoomFade(getZoomProgress()), scrollFade(hero));
      const warmth = pageWarmth();
      if (Math.abs(fade - lastFade) > 0.002) {
        lastFade = fade;
        el.style.setProperty("--bd-fade", fade.toFixed(3));
      }
      if (Math.abs(warmth - lastWarmth) > 0.01) {
        lastWarmth = warmth;
        el.style.setProperty("--bd-warmth", warmth.toFixed(2));
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    const pause = () => {
      el.dataset.paused = document.hidden ? "true" : "false";
    };

    paint();
    pause();
    const unsubscribe = subscribeZoom(schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", pause);
    return () => {
      unsubscribe();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", pause);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={root} aria-hidden className="backdrop" data-backdrop>
      <div className="backdrop-layer backdrop-haze" />
      <div className="backdrop-layer backdrop-texture" />
      <div className="backdrop-layer backdrop-blob backdrop-gold" />
      <div className="backdrop-layer backdrop-blob backdrop-peach" />
      <div className="backdrop-layer backdrop-blob backdrop-coral" />
      <div className="backdrop-layer backdrop-warm" />
      <div className="backdrop-layer backdrop-symbols">
        <span className="backdrop-symbol backdrop-symbol-1 symbol-rotate"><Enso /></span>
        <span className="backdrop-symbol backdrop-symbol-2 symbol-drift"><Lotus /></span>
        <span className="backdrop-symbol backdrop-symbol-3 symbol-drift"><Unalome /></span>
        <span className="backdrop-symbol backdrop-symbol-4 symbol-rotate"><Mandala /></span>
        <span className="backdrop-symbol backdrop-symbol-5 symbol-drift"><Lotus /></span>
        <span className="backdrop-symbol backdrop-symbol-6 symbol-rotate"><Enso /></span>
        <span className="backdrop-symbol backdrop-symbol-7 symbol-drift"><Unalome /></span>
        <span className="backdrop-symbol backdrop-symbol-8 symbol-rotate"><Mandala /></span>
      </div>
      <div className="backdrop-layer backdrop-veil" />
    </div>
  );
}
