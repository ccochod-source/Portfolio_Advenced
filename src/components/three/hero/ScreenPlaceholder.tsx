"use client";

import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Matrix4, Quaternion, Vector3 } from "three";
import { SCREEN_SIZE, getScreenWorld } from "./desk";
import { PALETTE } from "./constants";

/**
 * TEMPORARY stand-in for the laptop screen of the DeskScene (to be deleted by the integrator).
 * A plane named `laptop-screen` at the contract position, with a thin lid behind it:
 * ScreenContent and CameraRig only depend on the contract (desk.ts) and on that mesh name.
 * The real mesh must be a single front face whose UVs span 0..1 (u right, v up) with +Z = screen normal.
 */
export function ScreenPlaceholder() {
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const { position, quaternion } = useMemo(() => {
    const { center, normal } = getScreenWorld(aspect);
    const up = new Vector3(0, 1, 0).addScaledVector(normal, -normal.y).normalize();
    const right = new Vector3().crossVectors(up, normal).normalize();
    const q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, normal));
    return { position: center, quaternion: q };
  }, [aspect]);

  return (
    <group position={position} quaternion={quaternion}>
      <mesh name="laptop-screen">
        <planeGeometry args={[SCREEN_SIZE.width, SCREEN_SIZE.height]} />
        <meshBasicMaterial color={PALETTE.cream} />
      </mesh>
      <mesh position={[0, 0, -0.004]}>
        <boxGeometry args={[SCREEN_SIZE.width + 0.016, SCREEN_SIZE.height + 0.016, 0.006]} />
        <meshBasicMaterial color={PALETTE.ink} />
      </mesh>
    </group>
  );
}
