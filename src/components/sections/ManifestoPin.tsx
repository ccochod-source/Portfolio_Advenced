"use client";

import type { ReactNode } from "react";
import { Pin } from "@/components/motion";
import { setManifestoProgress } from "@/lib/avatar/story";

/** Pinned manifesto scene: scroll progress (0 → 1 over 1.5 viewports) drives the promises and the walking avatar. */
export function ManifestoPin({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Pin
      as="section"
      id={id}
      length={1.5}
      pinOnMobile={false}
      onProgress={setManifestoProgress}
      className="relative"
      innerClassName="manifesto-stage relative flex flex-col justify-between overflow-hidden py-24 md:min-h-svh md:py-20"
    >
      {children}
    </Pin>
  );
}
