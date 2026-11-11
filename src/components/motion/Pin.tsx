"use client";

import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { EASE, MEDIA } from "@/lib/motion/ease";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import type { MotionBaseProps, MotionElement } from "./types";

export type PinOptions = {
  /** Scroll distance while pinned, in viewport heights. */
  length?: number;
  /** ScrollTrigger start. */
  start?: string;
  /** `true` follows the scroll exactly, a number adds that many seconds of catch-up. */
  scrub?: boolean | number;
  /** Set false to skip pinning under 768 px (content then renders at progress 1). */
  pinOnMobile?: boolean;
  /** Called with the 0..1 progress on every update. */
  onProgress?: (progress: number) => void;
};

/**
 * Pins `target` and writes its scroll progress to the `--progress` CSS variable (0..1).
 * `target` must sit inside a wrapper React owns, because ScrollTrigger inserts a spacer around it.
 * Without motion (reduced motion, or mobile with `pinOnMobile: false`) nothing is pinned and progress is 1.
 */
export function usePin(
  target: RefObject<HTMLElement | null>,
  { length = 1, start = "top top", scrub = true, pinOnMobile = true, onProgress }: PinOptions = {},
) {
  const callback = useRef(onProgress);
  useEffect(() => {
    callback.current = onProgress;
  }, [onProgress]);

  useGSAP(
    () => {
      const element = target.current;
      if (!element) return;
      const mm = gsap.matchMedia();
      const report = (progress: number) => {
        element.style.setProperty("--progress", progress.toFixed(4));
        callback.current?.(progress);
      };

      mm.add({ motion: MEDIA.motion, reduce: MEDIA.reduce, mobile: MEDIA.mobile }, (context) => {
        const { motion, mobile } = context.conditions as { motion: boolean; mobile: boolean };
        if (!motion || (mobile && !pinOnMobile)) {
          report(1);
          return;
        }
        const state = { progress: 0 };
        report(0);
        gsap.to(state, {
          progress: 1,
          ease: EASE.linear,
          onUpdate: () => report(state.progress),
          scrollTrigger: {
            trigger: element,
            start,
            end: () => `+=${window.innerHeight * length}`,
            pin: true,
            scrub,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      });
    },
    { dependencies: [length, start, scrub, pinOnMobile], revertOnUpdate: true },
  );
}

export type PinProps = MotionBaseProps &
  PinOptions & {
    /** Class for the pinned element (the one carrying `--progress`). */
    innerClassName?: string;
  };

export function Pin({
  as = "section",
  length,
  start,
  scrub,
  pinOnMobile,
  onProgress,
  className,
  innerClassName = "",
  children,
  ...rest
}: PinProps) {
  const inner = useRef<HTMLDivElement>(null);
  usePin(inner, { length, start, scrub, pinOnMobile, onProgress });

  const Tag = as as unknown as MotionElement;
  return (
    <Tag {...rest} className={className}>
      <div ref={inner} className={innerClassName} style={{ "--progress": 0 } as CSSProperties}>
        {children}
      </div>
    </Tag>
  );
}
