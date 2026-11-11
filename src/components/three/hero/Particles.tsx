"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import { Color, NormalBlending, Vector2, type ShaderMaterial } from "three";
import { PALETTE } from "./constants";
import { PARTICLE_FRAGMENT, PARTICLE_VERTEX } from "./shaders";
import { useSceneTime } from "./useSceneTime";

const RANGE = 7;

export type MouseState = { target: Vector2; current: Vector2; strength: number; targetStrength: number };

/** Deterministic PRNG (mulberry32) so the particle field is stable across renders. */
function createRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildAttributes(count: number) {
  const rand = createRandom(1337 + count);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const depth = rand();
    positions[i * 3] = (rand() - 0.5) * 11;
    positions[i * 3 + 1] = (rand() - 0.5) * RANGE;
    positions[i * 3 + 2] = -3 + depth * 5.5;
    sizes[i] = 0.6 + Math.pow(rand(), 2.2) * 2.6;
    seeds[i] = rand();
    speeds[i] = 0.12 + rand() * 0.3;
  }
  return { positions, sizes, seeds, speeds };
}

export function Particles({ count, animate, mouseRef }: { count: number; animate: boolean; mouseRef: RefObject<MouseState> }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const materialRef = useRef<ShaderMaterial>(null);

  const attributes = useMemo(() => buildAttributes(count), [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new Vector2(10, 10) },
      uMouseStrength: { value: 0 },
      uAspect: { value: 1 },
      uPixelRatio: { value: 1 },
      uHeight: { value: 800 },
      uRange: { value: RANGE },
      uColorA: { value: new Color(PALETTE.sun) },
      uColorB: { value: new Color(PALETTE.cream) },
    }),
    [],
  );

  useEffect(() => {
    const u = materialRef.current?.uniforms;
    if (!u) return;
    u.uAspect.value = size.width / Math.max(1, size.height);
    u.uHeight.value = size.height;
    u.uPixelRatio.value = dpr;
  }, [size, dpr]);

  useSceneTime((_, t, delta) => {
    const mat = materialRef.current;
    const m = mouseRef.current;
    if (!mat || !m) return;
    const k = 1 - Math.exp(-delta * 5);
    m.current.lerp(m.target, k);
    m.strength += (m.targetStrength - m.strength) * k;
    mat.uniforms.uTime.value = t;
    (mat.uniforms.uMouse.value as Vector2).copy(m.current);
    mat.uniforms.uMouseStrength.value = m.strength;
  }, animate);

  return (
    <points frustumCulled={false}>
      <bufferGeometry key={count}>
        <bufferAttribute attach="attributes-position" args={[attributes.positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[attributes.sizes, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[attributes.seeds, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[attributes.speeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={PARTICLE_VERTEX}
        fragmentShader={PARTICLE_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={NormalBlending}
      />
    </points>
  );
}
