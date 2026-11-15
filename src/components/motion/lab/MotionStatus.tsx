"use client";

import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export function MotionStatus({ on, off }: { on: string; off: string }) {
  const reduced = useReducedMotion();
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-current/25 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider">
      <span aria-hidden className={`size-1.5 rounded-full ${reduced ? "bg-cream-dim" : "bg-gold"}`} />
      {reduced ? off : on}
    </span>
  );
}
