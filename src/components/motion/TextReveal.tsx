"use client";

import { useRef } from "react";
import { DURATION, EASE, MEDIA, SCROLL_START, STAGGER } from "@/lib/motion/ease";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/motion/gsap";
import { whenPageRevealed } from "@/lib/motion/preloader";
import type { MotionBaseProps, MotionElement } from "./types";

export type TextRevealType = "lines" | "words" | "chars";

export type TextRevealProps = MotionBaseProps & {
  /** Unit that slides up from behind the line mask. */
  type?: TextRevealType;
  /** Seconds between units. Defaults depend on `type`. */
  stagger?: number;
  delay?: number;
  duration?: number;
  /** ScrollTrigger start. */
  start?: string;
  /** Play only the first time it enters the viewport. */
  once?: boolean;
  /** Hide the text until GSAP is ready (default). Set `false` for the LCP headline so the server-rendered text paints at once. */
  pending?: boolean;
};

const splitTypes: Record<TextRevealType, string> = {
  lines: "lines",
  words: "lines,words",
  chars: "lines,words,chars",
};

const FONT_TIMEOUT = 1500;

export function TextReveal({
  as = "p",
  type = "lines",
  stagger,
  delay = 0,
  duration = DURATION.base,
  start = SCROLL_START,
  once = true,
  pending = true,
  className,
  children,
  ...rest
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  // Headings can be named by aria-label, so the split pieces are hidden from
  // assistive tech; other tags keep their text exposed (aria-label is unreliable there).
  const isHeading = /^h[1-6]$/.test(as);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        let cancelled = false;
        let split: SplitText | undefined;
        let trigger: ScrollTrigger | undefined;
        let cancelWait = () => {};
        let played = false;

        const init = () => {
          if (cancelled || split) return;
          split = SplitText.create(element, {
            type: splitTypes[type],
            mask: "lines",
            linesClass: "motion-line",
            autoSplit: true,
            aria: isHeading ? "auto" : "none",
            onSplit(self: SplitText) {
              trigger?.kill();
              cancelWait();
              element.removeAttribute("data-motion-pending");
              if (played) return;
              const tween = gsap.from(self[type], {
                yPercent: 125,
                duration,
                delay,
                ease: EASE.out,
                stagger: stagger ?? STAGGER[type],
                paused: true,
                onComplete: () => {
                  played = once;
                },
              });
              trigger = ScrollTrigger.create({
                trigger: element,
                start,
                once,
                onEnter: () => {
                  cancelWait = whenPageRevealed(() => tween.play());
                },
                onLeaveBack: () => tween.pause(0),
              });
              return tween;
            },
          });
        };

        const timeout = window.setTimeout(init, FONT_TIMEOUT);
        document.fonts.ready.then(() => {
          window.clearTimeout(timeout);
          init();
        });

        return () => {
          cancelled = true;
          window.clearTimeout(timeout);
          cancelWait();
          trigger?.kill();
          split?.revert();
        };
      });
    },
    { scope: ref, dependencies: [type, stagger, delay, duration, start, once, isHeading], revertOnUpdate: true },
  );

  const Tag = as as unknown as MotionElement;
  return (
    <Tag
      {...rest}
      ref={ref}
      className={className}
      data-motion-pending={pending ? "" : undefined}
      aria-label={isHeading && typeof children === "string" ? children : undefined}
    >
      {children}
    </Tag>
  );
}
