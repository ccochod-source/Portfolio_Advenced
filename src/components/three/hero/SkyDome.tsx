"use client";

import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { EquirectangularReflectionMapping, Group, SRGBColorSpace, type Texture } from "three";
import { CLOUD_TEXTURE_URLS, SKY_TEXTURE_URL } from "./constants";
import type { MouseState } from "./mouse";
import { useSceneTime } from "./useSceneTime";

/** Orientation of the equirect sky: yaw puts the sun low on the right behind the cloud, pitch drops the horizon below the centre. */
export const SKY_YAW = 1.15;
export const SKY_PITCH = 0.22;

type Layer = { z: number; y: number; scale: number; count: number; speed: number; alpha: number; parallax: number };
/** Far → near. Near clouds are large, faint and sit low so they frame the set without covering the headline. */
const LAYERS: Layer[] = [
  { z: -6, y: -1.2, scale: 3.4, count: 5, speed: 0.045, alpha: 0.75, parallax: 0.08 },
  { z: -3, y: -1.9, scale: 2.8, count: 4, speed: 0.08, alpha: 0.85, parallax: 0.18 },
  { z: 1.2, y: -3.1, scale: 3.6, count: 3, speed: 0.13, alpha: 0.6, parallax: 0.35 },
];

/** Deterministic PRNG (mulberry32) so the cloud field is stable across renders. */
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

type Cloud = { x: number; y: number; z: number; w: number; h: number; tex: number; alpha: number; speed: number; flip: boolean };

function buildClouds(counts: readonly number[]) {
  const rand = createRandom(4242);
  const clouds: Cloud[] = [];
  LAYERS.forEach((layer, li) => {
    const n = counts[li] ?? layer.count;
    for (let i = 0; i < n; i++) {
      const w = layer.scale * (0.8 + rand() * 0.5);
      clouds.push({
        x: -8 + (i + rand() * 0.6) * (16 / n),
        y: layer.y + (rand() - 0.5) * 0.9,
        z: layer.z + (rand() - 0.5) * 0.6,
        w,
        h: w * 0.5,
        tex: Math.floor(rand() * CLOUD_TEXTURE_URLS.length),
        alpha: layer.alpha * (0.7 + rand() * 0.3),
        speed: layer.speed * (0.8 + rand() * 0.4),
        flip: rand() > 0.5,
      });
    }
  });
  return clouds;
}

const HALF_SPAN = 9;

/** Golden-hour equirect sky as background + environment light, plus three layers of slowly drifting cloud billboards. */
export function SkyDome({ animate, mouseRef, counts }: { animate: boolean; mouseRef: RefObject<MouseState>; counts: readonly number[] }) {
  const get = useThree((s) => s.get);
  const sky = useTexture(SKY_TEXTURE_URL, (tex) => {
    tex.mapping = EquirectangularReflectionMapping;
    tex.colorSpace = SRGBColorSpace;
  });
  const cloudTextures = useTexture([...CLOUD_TEXTURE_URLS], (textures) => {
    (textures as Texture[]).forEach((t) => {
      t.colorSpace = SRGBColorSpace;
    });
  }) as Texture[];
  const groups = useRef<(Group | null)[]>([]);
  const clouds = useMemo(() => buildClouds(counts), [counts]);
  const scroll = useRef(0);

  useLayoutEffect(() => {
    const scene = get().scene;
    scene.background = sky;
    scene.environment = sky;
    scene.backgroundRotation.set(SKY_PITCH, SKY_YAW, 0);
    scene.environmentRotation.set(SKY_PITCH, SKY_YAW, 0);
    scene.backgroundIntensity = 1;
    scene.environmentIntensity = 0.55;
    return () => {
      scene.background = null;
      scene.environment = null;
    };
  }, [get, sky]);

  useFrame(() => {
    scroll.current = typeof window === "undefined" ? 0 : window.scrollY / Math.max(1, window.innerHeight);
  });

  useSceneTime((_, t, dt) => {
    const m = mouseRef.current;
    const mx = m ? m.current.x * m.strength : 0;
    const my = m ? m.current.y * m.strength : 0;
    clouds.forEach((c, i) => {
      const g = groups.current[i];
      if (!g) return;
      c.x += c.speed * dt;
      if (c.x > HALF_SPAN) c.x -= HALF_SPAN * 2;
      const layer = LAYERS.find((l) => Math.abs(l.z - c.z) < 0.5) ?? LAYERS[1];
      g.position.set(c.x - mx * layer.parallax * 1.6, c.y + scroll.current * layer.parallax * 6 - my * layer.parallax, c.z);
      g.rotation.z = Math.sin(t * 0.05 + i) * 0.01;
    });
  }, animate);

  return (
    <group>
      {clouds.map((c, i) => (
        <group
          key={i}
          position={[c.x, c.y, c.z]}
          ref={(el) => {
            groups.current[i] = el;
          }}
        >
          <mesh scale={[c.flip ? -c.w : c.w, c.h, 1]} renderOrder={c.z > 0 ? 5 : -5}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={cloudTextures[c.tex]} transparent opacity={c.alpha} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

useTexture.preload(SKY_TEXTURE_URL);
useTexture.preload([...CLOUD_TEXTURE_URLS]);
