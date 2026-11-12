"use client";

import { useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Canvas, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { EquirectangularReflectionMapping, type PerspectiveCamera, SRGBColorSpace, Vector3 } from "three";
import { DeskScene } from "@/components/three/hero/DeskScene";
import { SKY_TEXTURE_URL } from "@/components/three/hero/constants";
import { SKY_PITCH, SKY_YAW } from "@/components/three/hero/SkyDome";
import { DESK_YAW, deskOriginFor, deskScaleFor } from "@/components/three/hero/desk";

const Y_AXIS = new Vector3(0, 1, 0);

function Env() {
  const get = useThree((s) => s.get);
  const sky = useTexture(SKY_TEXTURE_URL, (tex) => {
    tex.mapping = EquirectangularReflectionMapping;
    tex.colorSpace = SRGBColorSpace;
  });
  useLayoutEffect(() => {
    const scene = get().scene;
    scene.environment = sky;
    scene.environmentRotation.set(SKY_PITCH, SKY_YAW, 0);
    scene.environmentIntensity = 0.55;
  }, [get, sky]);
  return null;
}

/** Camera presets, set-local space (desk.ts: avatar faces +Z, feet at y = 0); the set is yawed/scaled for a portrait canvas. */
const VIEWS: Record<string, { pos: [number, number, number]; look: [number, number, number]; fov: number }> = {
  poster: { pos: [-0.3, 0.8, 4.2], look: [0, 0.45, 0], fov: 32 },
  side: { pos: [2.4, 0.95, 0.3], look: [0, 0.7, 0.3], fov: 32 },
  hands: { pos: [1.1, 0.78, 0.32], look: [0, 0.63, 0.32], fov: 30 },
  front: { pos: [0, 1.0, 2.6], look: [0, 0.7, 0.3], fov: 32 },
};

function Cam({ view }: { view: string }) {
  const get = useThree((s) => s.get);
  useLayoutEffect(() => {
    const camera = get().camera as PerspectiveCamera;
    const aspect = 720 / 960;
    const origin = new Vector3(...deskOriginFor(aspect));
    const scale = deskScaleFor(aspect);
    const toWorld = (p: [number, number, number]) =>
      new Vector3(...p).multiplyScalar(scale).applyAxisAngle(Y_AXIS, DESK_YAW).add(origin);
    const preset = VIEWS[view] ?? VIEWS.poster;
    camera.position.copy(toWorld(preset.pos));
    camera.fov = preset.fov;
    camera.lookAt(toWorld(preset.look));
    camera.updateProjectionMatrix();
  }, [get, view]);
  return null;
}

export function PosterClient() {
  const view = useSearchParams().get("view") ?? "poster";
  return (
    <div id="poster" style={{ width: 720, height: 960, position: "fixed", inset: 0, background: view === "poster" ? "transparent" : "#fff4e6", zIndex: 1000 }}>
      <Canvas dpr={1} camera={{ position: [0, 0, 6], fov: 32, near: 0.02, far: 40 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} style={{ background: "transparent" }}>
        <Env />
        <Cam view={view} />
        <DeskScene />
      </Canvas>
    </div>
  );
}
