"use client";

import { useRef } from "react";
import { EASE, MEDIA } from "@/lib/motion/ease";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import type { MotionBaseProps, MotionElement } from "./types";

export type ParallaxProps = MotionBaseProps & {
  /** Travel as a fraction of the element height over the whole pass through the viewport. Negative reverses the direction. */
  speed?: number;
  /** Clip the wrapper and scale the content so no gap shows (images inside cards). */
  cover?: boolean;
  /** Class for the moving inner element. */
  innerClassName?: string;
};

export function Parallax({
  as = "div",
  speed = 0.12,
  cover = false,
  className = "",
  innerClassName = "",
  children,
  ...rest
}: ParallaxProps) {
  const ref = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MEDIA.motion, mobile: MEDIA.mobile }, (context) => {
        const { motion, mobile } = context.conditions as { motion: boolean; mobile: boolean };
        if (!motion) return;
        const amount = speed * 50 * (mobile ? 0.5 : 1);
        gsap.fromTo(
          inner.current,
          { yPercent: -amount, scale: cover ? 1 + Math.abs(amount) / 50 : 1 },
          {
            yPercent: amount,
            ease: EASE.linear,
            scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    },
    { scope: ref, dependencies: [speed, cover], revertOnUpdate: true },
  );

  const Tag = as as unknown as MotionElement;
  return (
    <Tag {...rest} ref={ref} className={`${cover ? "overflow-hidden " : ""}${className}`}>
      <div ref={inner} className={`will-change-transform ${cover ? "h-full w-full " : ""}${innerClassName}`}>
        {children}
      </div>
    </Tag>
  );
}
