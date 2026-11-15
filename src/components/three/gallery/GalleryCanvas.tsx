"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ActivityPause } from "../ActivityPause";
import { GalleryScene, type GallerySceneProps } from "./GalleryScene";

export type GalleryCanvasProps = GallerySceneProps & { active: boolean };

/** Transparent canvas (the silk backdrop shows through), DPR capped at 1.5, render loop stopped offscreen. */
export function GalleryCanvas({ items, onReady, active }: GalleryCanvasProps) {
  const frameloop = active ? "always" : "never";
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={frameloop}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <ActivityPause frameloop={frameloop} />
      <Suspense fallback={null}>
        <GalleryScene items={items} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
