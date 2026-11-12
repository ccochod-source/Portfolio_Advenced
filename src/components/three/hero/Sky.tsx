"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Color, type ShaderMaterial } from "three";
import { PALETTE } from "./constants";
import { SKY_FRAGMENT, SKY_VERTEX } from "./shaders";
import { useSceneTime } from "./useSceneTime";

export function Sky({ animate }: { animate: boolean }) {
  const size = useThree((s) => s.size);
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uSunPos: { value: [0.68, 0.3] },
      uCream: { value: new Color(PALETTE.cream) },
      uCreamDeep: { value: new Color(PALETTE.creamDeep) },
      uGold: { value: new Color(PALETTE.gold) },
      uSun: { value: new Color(PALETTE.sun) },
      uCoral: { value: new Color(PALETTE.coral) },
    }),
    [],
  );

  useEffect(() => {
    const u = materialRef.current?.uniforms;
    if (!u) return;
    u.uAspect.value = size.width / Math.max(1, size.height);
    u.uSunPos.value = size.width < size.height ? [0.62, 0.28] : [0.68, 0.3];
  }, [size]);

  useSceneTime((_, t) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = t;
  }, animate);

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={SKY_VERTEX}
        fragmentShader={SKY_FRAGMENT}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
