"use client";

import { useRef } from "react";
import { DURATION, EASE, MEDIA, SCROLL_START } from "@/lib/motion/ease";
import { formatNumber, type NumberLocale } from "@/lib/motion/format";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { whenPageRevealed } from "@/lib/motion/preloader";

export type CounterProps = {
  value: number;
  from?: number;
  /** Thousands/decimal separators: "fr" → 16 000, "en" → 16,000. */
  locale?: NumberLocale;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  start?: string;
  className?: string;
};

export function Counter({
  value,
  from = 0,
  locale = "fr",
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = DURATION.slow + 0.4,
  delay = 0,
  start = SCROLL_START,
  className = "",
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const display = useRef<HTMLSpanElement>(null);
  const format = (n: number) => `${prefix}${formatNumber(n, locale, decimals)}${suffix}`;
  const final = format(value);

  useGSAP(
    () => {
      const node = display.current;
      if (!node) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        const state = { n: from };
        let cancelWait = () => {};
        const render = () => {
          node.textContent = `${prefix}${formatNumber(state.n, locale, decimals)}${suffix}`;
        };
        render();

        const tween = gsap.to(state, {
          n: value,
          duration,
          delay,
          ease: EASE.out,
          paused: true,
          onUpdate: render,
        });
        ScrollTrigger.create({
          trigger: ref.current,
          start,
          once: true,
          onEnter: () => {
            cancelWait = whenPageRevealed(() => tween.play());
          },
        });

        return () => {
          cancelWait();
          node.textContent = `${prefix}${formatNumber(value, locale, decimals)}${suffix}`;
        };
      });
    },
    { scope: ref, dependencies: [value, from, locale, decimals, prefix, suffix, duration, delay, start], revertOnUpdate: true },
  );

  // The final value is what the server renders and what assistive tech reads.
  return (
    <span ref={ref} className={`inline-block tabular-nums ${className}`}>
      <span className="sr-only">{final}</span>
      <span ref={display} aria-hidden>
        {final}
      </span>
    </span>
  );
}
