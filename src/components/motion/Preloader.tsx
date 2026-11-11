"use client";

import { useEffect, useId, useRef } from "react";
import { EASE, MEDIA } from "@/lib/motion/ease";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { markPageRevealed, markPreloaderActive, PRELOADER_STORAGE_KEY } from "@/lib/motion/preloader";
import { lockScroll, unlockScroll } from "@/lib/motion/scroll";

export type PreloaderProps = {
  /** Large word shown while loading, e.g. "Bonjour." / "Hello." */
  greeting: string;
  /** Small mono line in the top-left corner. */
  label?: string;
  /** Small mono hint in the top-right corner, e.g. "Cliquer pour passer". */
  skipHint?: string;
  /** Seconds for the 0 → 100 count. The curtain wipe adds 0.75 s. */
  duration?: number;
  /** Play even if already seen this session (still instant with reduced motion). */
  force?: boolean;
  /** sessionStorage key used to show it once per session. */
  storageKey?: string;
  /** Called once the curtain is gone, and immediately when the preloader is skipped entirely. */
  onComplete?: () => void;
};

const WIPE = 0.75;

function wasSeen(key: string) {
  try {
    return window.sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

function markSeen(key: string) {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Storage can be blocked: the preloader then plays on every load.
  }
}

/**
 * Full-screen curtain with a counter. Render it once, as early as possible in <body>, and never
 * inside a `Reveal` / transformed / hidden ancestor (it is `position: fixed`).
 * An inline script hides it before first paint when it must not play (already seen, reduced motion).
 */
export function Preloader({
  greeting,
  label,
  skipHint,
  duration = 1.05,
  force = false,
  storageKey = PRELOADER_STORAGE_KEY,
  onComplete,
}: PreloaderProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const callback = useRef(onComplete);
  useEffect(() => {
    callback.current = onComplete;
  }, [onComplete]);

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const q = gsap.utils.selector(element);
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        element.dataset.state = "done";
        markSeen(storageKey);
        markPageRevealed();
        callback.current?.();
      };

      const reduced = window.matchMedia(MEDIA.reduce).matches;
      if (reduced || (!force && wasSeen(storageKey))) {
        finish();
        return;
      }

      element.dataset.state = "active";
      markPreloaderActive();
      lockScroll();

      const count = { value: 0 };
      const timeline = gsap.timeline({
        onComplete: () => {
          unlockScroll();
          finish();
        },
      });
      timeline
        .from(q("[data-preloader-greeting]"), { yPercent: 115, duration: 0.7, ease: EASE.out }, 0)
        .from(q("[data-preloader-meta]"), { autoAlpha: 0, duration: 0.4 }, 0)
        .to(
          count,
          {
            value: 100,
            duration,
            ease: EASE.softInOut,
            onUpdate: () => {
              if (counter.current) counter.current.textContent = String(Math.round(count.value)).padStart(3, "0");
            },
          },
          0,
        )
        .fromTo(q("[data-preloader-bar]"), { scaleX: 0 }, { scaleX: 1, duration, ease: EASE.softInOut }, 0)
        .addLabel("exit")
        .call(markPageRevealed, undefined, "exit+=0.2")
        .to(q("[data-preloader-content]"), { yPercent: -18, autoAlpha: 0, duration: WIPE * 0.8, ease: EASE.inOut }, "exit")
        .to(q("[data-preloader-front]"), { clipPath: "inset(0% 0% 100% 0%)", duration: WIPE - 0.1, ease: EASE.inOut }, "exit")
        .to(q("[data-preloader-back]"), { clipPath: "inset(0% 0% 100% 0%)", duration: WIPE - 0.1, ease: EASE.inOut }, "exit+=0.1");

      const skip = (event: Event) => {
        if (event instanceof KeyboardEvent && !["Escape", "Enter", " "].includes(event.key)) return;
        const exit = timeline.labels.exit;
        if (timeline.time() < exit) timeline.seek(exit, false);
        timeline.timeScale(1.5);
      };
      const events = ["pointerdown", "keydown", "wheel", "touchmove"] as const;
      events.forEach((name) => window.addEventListener(name, skip, { passive: true }));

      return () => {
        events.forEach((name) => window.removeEventListener(name, skip));
        if (!finished) unlockScroll();
      };
    },
    { scope: root, dependencies: [duration, force, storageKey], revertOnUpdate: true },
  );

  // Runs while the HTML is parsed, so a returning visitor never sees the curtain flash.
  const script = `(function(){var e=document.getElementById(${JSON.stringify(id)}),s=false;try{s=sessionStorage.getItem(${JSON.stringify(storageKey)})!==null}catch(_){}if(${force ? "" : "s||"}matchMedia(${JSON.stringify(MEDIA.reduce)}).matches){if(e)e.setAttribute("data-state","done");window.__preloader="done"}else{window.__preloader="active"}})()`;

  return (
    <>
      <div ref={root} id={id} aria-hidden className="preloader" data-state="pending" suppressHydrationWarning>
        <div data-preloader-back className="preloader-panel bg-ink" />
        <div data-preloader-front className="preloader-panel preloader-gradient">
          <div data-preloader-content className="flex h-full flex-col justify-between p-6 md:p-12">
            <div data-preloader-meta className="flex items-start justify-between gap-6 font-mono text-label uppercase">
              <span>{label}</span>
              <span className="text-right opacity-70">{skipHint}</span>
            </div>
            <div className="flex items-end justify-between gap-6">
              <p className="overflow-hidden pb-[0.12em] text-h1 font-medium">
                <span data-preloader-greeting className="block">
                  {greeting}
                </span>
              </p>
              <p data-preloader-meta className="font-mono text-h2 tabular-nums">
                <span ref={counter}>000</span>
              </p>
            </div>
          </div>
          <span data-preloader-bar className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-ink" />
        </div>
      </div>
      <script
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: script }}
      />
    </>
  );
}
