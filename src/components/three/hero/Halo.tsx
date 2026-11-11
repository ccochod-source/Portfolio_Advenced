"use client";

import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, type ShaderMaterial } from "three";
import { useThree } from "@react-three/fiber";
import { heroFocusFor, PALETTE } from "./constants";
import { HALO_FRAGMENT, HALO_VERTEX } from "./shaders";
import { useSceneTime } from "./useSceneTime";

function useHaloUniforms(intensity: number) {
  return useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uGold: { value: new Color(PALETTE.gold) },
      uSun: { value: new Color(PALETTE.sun) },
      uCream: { value: new Color(PALETTE.cream) },
    }),
    [intensity],
  );
}

/** Luminous "neural sun" at HERO_FOCUS_POSITION: a vertical haloRef plus a tilted light padRef on the ground. */
export function Halo({ animate }: { animate: boolean }) {
  const haloRef = useRef<ShaderMaterial>(null);
  const padRef = useRef<ShaderMaterial>(null);
  const haloUniforms = useHaloUniforms(0.7);
  const padUniforms = useHaloUniforms(0.35);
  const size = useThree((s) => s.size);
  const [x, y, z] = heroFocusFor(size.width / Math.max(1, size.height));

  useSceneTime((_, t) => {
    if (haloRef.current) haloRef.current.uniforms.uTime.value = t;
    if (padRef.current) padRef.current.uniforms.uTime.value = -t * 0.7;
  }, animate);

  const materialProps = { vertexShader: HALO_VERTEX, fragmentShader: HALO_FRAGMENT, transparent: true, depthWrite: false, blending: AdditiveBlending };

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.55, -0.3]} scale={[3, 3, 1]} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={haloRef} uniforms={haloUniforms} {...materialProps} />
      </mesh>
      <mesh rotation={[-Math.PI / 2.25, 0, 0]} scale={[3.2, 3.2, 1]} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={padRef} uniforms={padUniforms} {...materialProps} />
      </mesh>
    </group>
  );
}
