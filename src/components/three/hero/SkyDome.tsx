"use client";

import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { BackSide, EquirectangularReflectionMapping, Group, RepeatWrapping, SRGBColorSpace, type ShaderMaterial, type Texture, Vector2, Vector4 } from "three";
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

const MAX_RIPPLES = 8;
type SkyUniforms = {
  uSky: { value: Texture };
  uClouds: { value: Texture };
  uTime: { value: number };
  uAspect: { value: number };
  uRipples: { value: Vector4[] };
};
const SKY_VERTEX = /* glsl */ `
  varying vec3 vDir;
  varying vec2 vScreen;
  void main() {
    vDir = normalize(position);
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vScreen = clip.xy / clip.w * 0.5 + 0.5;
    gl_Position = clip;
  }
`;
/**
 * Photoreal equirect sunset + a slowly drifting cloud layer, distorted by pointer ripples: each ripple is a damped
 * ring (screen space) that displaces the sky lookup, giving the liquid "touch the sky" feel of codeofsagar.in.
 */
const SKY_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D uSky;
  uniform sampler2D uClouds;
  uniform float uTime;
  uniform float uAspect;
  uniform vec4 uRipples[${MAX_RIPPLES}];
  varying vec3 vDir;
  varying vec2 vScreen;
  const float PI = 3.14159265;

  void main() {
    vec3 d = normalize(vDir);
    vec2 uv = vec2(atan(d.z, d.x) / (2.0 * PI) + 0.5, asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5);

    vec2 disp = vec2(0.0);
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = uRipples[i];
      if (r.w <= 0.0) continue;
      float age = uTime - r.z;
      vec2 toP = (vScreen - r.xy) * vec2(uAspect, 1.0);
      float dist = length(toP);
      float front = age * 0.55;
      float ring = sin((dist - front) * 26.0) * exp(-abs(dist - front) * 7.0);
      float amp = ring * exp(-age * 1.6) * r.w * 0.014;
      disp += (dist > 1e-4 ? toP / dist : vec2(0.0)) * amp;
    }
    uv += disp;

    vec3 col = texture2D(uSky, uv).rgb;
    // Drifting high clouds, only above the horizon, tiled and scrolled slowly.
    vec2 cuv = vec2(uv.x * 3.0 + uTime * 0.0035, uv.y * 2.0 - 0.95);
    float cloud = texture2D(uClouds, cuv).a * smoothstep(0.5, 0.58, uv.y) * smoothstep(0.98, 0.7, uv.y);
    col = mix(col, vec3(1.0, 0.92, 0.82), cloud * 0.28);
    // Lighter cream zenith: keeps the coral wordmark legible over the sky.
    col = mix(col, vec3(1.0, 0.95, 0.88), smoothstep(0.6, 0.95, uv.y) * 0.4);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Golden-hour sunset dome (equirect photo + drifting cloud layer + pointer ripples, see SKY_FRAGMENT) that is also the
 * environment light, plus three layers of slowly drifting cloud billboards for parallax.
 */
export function SkyDome({ animate, mouseRef, counts }: { animate: boolean; mouseRef: RefObject<MouseState>; counts: readonly number[] }) {
  const get = useThree((s) => s.get);
  const sky = useTexture(SKY_TEXTURE_URL, (tex) => {
    tex.mapping = EquirectangularReflectionMapping;
    tex.colorSpace = SRGBColorSpace;
  });
  const cloudTextures = useTexture([...CLOUD_TEXTURE_URLS], (textures) => {
    (textures as Texture[]).forEach((t, i) => {
      t.colorSpace = SRGBColorSpace;
      // The first cloud texture doubles as the dome's tiled drift layer.
      if (i === 0) t.wrapS = t.wrapT = RepeatWrapping;
    });
  }) as Texture[];
  const groups = useRef<(Group | null)[]>([]);
  const clouds = useMemo(() => buildClouds(counts), [counts]);
  const scroll = useRef(0);
  // Stable uniform objects (mutated per frame, never re-created): a lazily initialised state.
  const [uniforms] = useState<SkyUniforms>(() => ({
    uSky: { value: sky },
    uClouds: { value: cloudTextures[0] },
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new Vector4(0, 0, 0, 0)) },
  }));
  const ripple = useRef({ next: 0, last: new Vector2(10, 10), lastSpawn: 0, time: 0 });

  useLayoutEffect(() => {
    const scene = get().scene;
    scene.environment = sky;
    scene.environmentRotation.set(SKY_PITCH, SKY_YAW, 0);
    scene.environmentIntensity = 0.55;
    return () => {
      scene.environment = null;
    };
  }, [get, sky]);

  const skyMaterial = useRef<ShaderMaterial>(null);

  useFrame(({ size }, delta) => {
    scroll.current = typeof window === "undefined" ? 0 : window.scrollY / Math.max(1, window.innerHeight);
    // Per-frame updates go through the material ref (the `uniforms` object above is only the initial value).
    const uniforms = skyMaterial.current?.uniforms as SkyUniforms | undefined;
    if (!uniforms) return;
    uniforms.uSky.value = sky;
    uniforms.uClouds.value = cloudTextures[0];
    uniforms.uAspect.value = size.width / Math.max(1, size.height);
    if (!animate) return;
    const r = ripple.current;
    r.time += Math.min(delta, 0.05);
    uniforms.uTime.value = r.time;
    // Spawn a ripple where the pointer moves, stronger when it moves fast; the buffer is a ring of MAX_RIPPLES.
    const m = mouseRef.current;
    if (!m || m.targetStrength === 0) return;
    const moved = m.target.distanceTo(r.last);
    if (r.last.x > 5) {
      r.last.copy(m.target);
      return;
    }
    if (moved > 0.004 && r.time - r.lastSpawn > 0.09) {
      const speed = Math.min(1, moved / Math.max(1e-3, delta) / 2.5);
      uniforms.uRipples.value[r.next].set((m.target.x + 1) / 2, (m.target.y + 1) / 2, r.time, 0.35 + speed * 0.65);
      r.next = (r.next + 1) % MAX_RIPPLES;
      r.lastSpawn = r.time;
      r.last.copy(m.target);
    }
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
      <mesh rotation={[SKY_PITCH, SKY_YAW, 0]} renderOrder={-20} frustumCulled={false}>
        <sphereGeometry args={[30, 48, 32]} />
        <shaderMaterial ref={skyMaterial} vertexShader={SKY_VERTEX} fragmentShader={SKY_FRAGMENT} uniforms={uniforms} side={BackSide} depthWrite={false} toneMapped={false} />
      </mesh>
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
