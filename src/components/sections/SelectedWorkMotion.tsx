"use client";

import { useRef, type ReactNode } from "react";
import { EASE, MEDIA } from "@/lib/motion/ease";
import { gsap, useGSAP } from "@/lib/motion/gsap";

type MockupMotionProps = { children: ReactNode; className?: string };

/** Laptop mock-up of a Selected Work card: scales up while entering, drifts upward while the card scrolls by. Static with reduced motion. */
export function MockupMotion({ children, className = "" }: MockupMotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MEDIA.motion, mobile: MEDIA.mobile }, (context) => {
        const { motion, mobile } = context.conditions as { motion: boolean; mobile: boolean };
        if (!motion) return;
        const drift = mobile ? 3 : 7;
        gsap.fromTo(
          inner.current,
          { scale: mobile ? 0.96 : 0.92 },
          { scale: 1, ease: EASE.linear, scrollTrigger: { trigger: ref.current, start: "top bottom", end: "center center", scrub: true } },
        );
        gsap.fromTo(
          ref.current,
          { yPercent: drift },
          { yPercent: -drift, ease: EASE.linear, scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
    },
    { scope: ref, revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      <div ref={inner} className="will-change-transform">
        {children}
      </div>
    </div>
  );
}
