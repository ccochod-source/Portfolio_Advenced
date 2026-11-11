"use client";

import { useRef, type ReactNode } from "react";
import { MEDIA } from "@/lib/motion/ease";
import { gsap, useGSAP } from "@/lib/motion/gsap";

export type MagneticProps = {
  /** How far the content follows the pointer (0 = static, 1 = sticks to it). */
  strength?: number;
  className?: string;
  children: ReactNode;
};

/** Pulls its content towards the pointer. Mouse/trackpad only; inert on touch and with reduced motion. */
export function Magnetic({ strength = 0.35, className = "", children }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const area = ref.current;
      const target = inner.current;
      if (!area || !target) return;
      const mm = gsap.matchMedia();

      mm.add(`${MEDIA.fine} and ${MEDIA.motion}`, () => {
        const xTo = gsap.quickTo(target, "x", { duration: 0.6, ease: "power3.out" });
        const yTo = gsap.quickTo(target, "y", { duration: 0.6, ease: "power3.out" });

        const move = (event: PointerEvent) => {
          const rect = area.getBoundingClientRect();
          xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
          yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
        };
        const leave = () => {
          xTo(0);
          yTo(0);
        };

        area.addEventListener("pointermove", move);
        area.addEventListener("pointerleave", leave);
        return () => {
          area.removeEventListener("pointermove", move);
          area.removeEventListener("pointerleave", leave);
        };
      });
    },
    { scope: ref, dependencies: [strength], revertOnUpdate: true },
  );

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      <span ref={inner} className="inline-block will-change-transform">
        {children}
      </span>
    </span>
  );
}
