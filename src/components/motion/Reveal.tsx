"use client";

import { useRef } from "react";
import { DURATION, EASE, MEDIA, SCROLL_START, STAGGER } from "@/lib/motion/ease";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { whenPageRevealed } from "@/lib/motion/preloader";
import type { MotionBaseProps, MotionElement } from "./types";

export type RevealProps = MotionBaseProps & {
  /** Slide distance in px (vertical). */
  y?: number;
  /** Slide distance in px (horizontal). */
  x?: number;
  /** Starting scale, e.g. 0.96. */
  scale?: number;
  duration?: number;
  delay?: number;
  /** Animate the direct children one after the other. `true` uses the default gap, a number sets it in seconds. */
  stagger?: boolean | number;
  start?: string;
  once?: boolean;
};

export function Reveal({
  as = "div",
  y = 36,
  x = 0,
  scale = 1,
  duration = DURATION.base,
  delay = 0,
  stagger = false,
  start = SCROLL_START,
  once = true,
  className,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        const targets = stagger ? Array.from(element.children) : element;
        let cancelWait = () => {};

        const tween = gsap.fromTo(
          targets,
          { autoAlpha: 0, x, y, scale },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration,
            delay,
            ease: EASE.out,
            stagger: stagger === true ? STAGGER.items : stagger || 0,
            paused: true,
            // Leftover transforms would break sticky/fixed descendants.
            onComplete: () => {
              if (once) gsap.set(targets, { clearProps: "transform,opacity,visibility" });
            },
          },
        );
        element.removeAttribute("data-motion-pending");

        ScrollTrigger.create({
          trigger: element,
          start,
          once,
          onEnter: () => {
            cancelWait = whenPageRevealed(() => tween.play());
          },
          onLeaveBack: () => tween.pause(0),
        });

        return () => cancelWait();
      });
    },
    { scope: ref, dependencies: [x, y, scale, duration, delay, stagger, start, once], revertOnUpdate: true },
  );

  const Tag = as as unknown as MotionElement;
  return (
    <Tag {...rest} ref={ref} className={className} data-motion-pending="">
      {children}
    </Tag>
  );
}
