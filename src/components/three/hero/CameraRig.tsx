"use client";

import { useEffect, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import { MathUtils, type PerspectiveCamera } from "three";
import { HERO_CAMERA_Z } from "./constants";
import type { MouseState } from "./mouse";
import { useSceneTime } from "./useSceneTime";

const BASE_FOV = 45;
const MIN_HALF_WIDTH = 2.3;

/** Keeps the focus area in frame on portrait screens and applies lerped mouse parallax. */
export function CameraRig({ parallax, mouseRef }: { parallax: boolean; mouseRef: RefObject<MouseState> }) {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);

  useEffect(() => {
    const camera = get().camera as PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const halfHeight = HERO_CAMERA_Z * Math.tan(MathUtils.degToRad(BASE_FOV / 2));
    const halfWidth = halfHeight * aspect;
    camera.fov =
      halfWidth < MIN_HALF_WIDTH ? MathUtils.radToDeg(2 * Math.atan(MIN_HALF_WIDTH / aspect / HERO_CAMERA_Z)) : BASE_FOV;
    camera.updateProjectionMatrix();
  }, [get, size]);

  useSceneTime(({ camera }, _, delta) => {
    const m = mouseRef.current;
    if (!m) return;
    const k = 1 - Math.exp(-delta * 3);
    const tx = m.current.x * 0.28 * m.strength;
    const ty = m.current.y * 0.16 * m.strength;
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.lookAt(0, 0, 0);
  }, parallax);

  return null;
}
