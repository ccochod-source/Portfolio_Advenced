"use client";

import type { ReactNode } from "react";
import { Pin } from "@/components/motion";
import { setManifestoProgress } from "@/lib/avatar/story";
import { ZOOM_PAGE_ATTR } from "@/lib/hero/zoom";

/** Pinned manifesto scene: scroll progress (0 → 1 over 1.5 viewports) drives the promises and the walking avatar. */
export function ManifestoPin({
  id,
  children,
  hud,
}: {
  id: string;
  children: ReactNode;
  hud: { left: string; center: string; right: string };
}) {
  return (
    <Pin
      as="section"
      id={id}
      data-hud-left={hud.left}
      data-hud-center={hud.center}
      data-hud-right={hud.right}
      {...{ [ZOOM_PAGE_ATTR]: "" }}
      length={1.1}
      pinOnMobile={false}
      onProgress={setManifestoProgress}
      className="relative"
      innerClassName="manifesto-stage relative flex flex-col justify-between overflow-hidden py-24 md:min-h-svh md:py-16"
    >
      {children}
    </Pin>
  );
}
