"use client";

import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Color, EquirectangularReflectionMapping, Group, MathUtils, SRGBColorSpace, type ShaderMaterial, type Texture, Vector2, Vector3, Vector4 } from "three";
import { CLOUD_PHOTO_URLS, HERO_SKY_PORTRAIT_URL, HERO_SKY_URL, SKY_TEXTURE_URL } from "./constants";
import type { MouseState } from "./mouse";
import { useSceneTime } from "./useSceneTime";

/** Orientation of the equirect sky: yaw puts the sun low on the right behind the cloud, pitch drops the horizon below the centre. */
export const SKY_YAW = 1.15;
export const SKY_PITCH = 0.22;

type Layer = { z: number; y: number; scale: number; count: number; speed: number; alpha: number; parallax: number };
type LayerLook = { tint: string };
/** Mid → near. The photo covers the distance; remaining warm clouds sit low at the frame edges. */
const LAYERS: (Layer & LayerLook)[] = [
  { z: -3, y: -3.05, scale: 1.2, count: 2, speed: 0.08, alpha: 0.38, parallax: 0.18, tint: "#fff7ee" },
  { z: 1.2, y: -3.3, scale: 1.15, count: 1, speed: 0.13, alpha: 0.42, parallax: 0.35, tint: "#fff9f0" },
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

type Cloud = { x: number; y: number; z: number; w: number; h: number; tex: number; alpha: number; speed: number; flip: boolean; layer: number };

function buildClouds(counts: readonly number[], portrait: boolean) {
  const rand = createRandom(4242);
  const clouds: Cloud[] = [];
  LAYERS.forEach((layer, li) => {
    const n = counts[li] ?? layer.count;
    for (let i = 0; i < n; i++) {
      const tall = !portrait && li === 0 && i === n - 1;
      const h = layer.scale * (0.88 + rand() * 0.24);
      const imageAspect = tall ? 1536 / 2752 : 2752 / 1536;
      const edge = portrait ? 0.85 + li * 0.2 + rand() * 0.3 : 4.8 + li * 0.8 + rand() * 0.8;
      clouds.push({
        x: ((i + li) % 2 === 0 ? -1 : 1) * edge,
        y: layer.y + (rand() - 0.5) * 0.36,
        z: layer.z + (rand() - 0.5) * 0.5,
        w: h * imageAspect,
        h,
        tex: tall ? 1 : 0,
        alpha: layer.alpha * (0.7 + rand() * 0.3),
        speed: layer.speed * (0.8 + rand() * 0.4),
        flip: rand() > 0.5,
        layer: li,
      });
    }
  });
  return clouds;
}

const HALF_SPAN = 9;

/** Photo-cloud billboard: preserve the warm image colour with a slight light tint and layer opacity. */
const CLOUD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const CLOUD_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform vec3 uTint;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(uMap, vUv);
    float a = tex.a * uOpacity;
    if (a < 0.003) discard;
    vec3 col = tex.rgb * uTint;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

const MAX_RIPPLES = 8;
type SkyUniforms = {
  uSkyPhoto: { value: Texture };
  uTime: { value: number };
  uAspect: { value: number };
  uResolution: { value: Vector2 };
  uImageAspect: { value: number };
  uFocus: { value: Vector2 };
  uParallax: { value: Vector2 };
  uTopWarm: { value: number };
  uRipples: { value: Vector4[] };
};
const SKY_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;
/**
 * The photo is cover-fitted around the focal point with bounded camera parallax. Pointer ripples stay a damped
 * screen-space shimmer, not a warp of the sky.
 */
const SKY_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D uSkyPhoto;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uResolution;
  uniform float uImageAspect;
  uniform vec2 uFocus;
  uniform vec2 uParallax;
  uniform float uTopWarm;
  uniform vec4 uRipples[${MAX_RIPPLES}];
  varying vec2 vUv;

  void main() {
    vec2 vScreen = gl_FragCoord.xy / uResolution;
    float viewAspect = uResolution.x / max(1.0, uResolution.y);
    float imageAspect = max(uImageAspect, 0.001);
    vec2 cover = vec2(1.0);
    if (viewAspect > imageAspect) cover.y = imageAspect / viewAspect;
    else cover.x = viewAspect / imageAspect;
    cover *= 1.0 / 1.06;
    vec2 uv = uFocus + (vUv - uFocus) * cover;
    vec2 minOffset = vec2(0.006) - (uFocus - uFocus * cover);
    vec2 maxOffset = vec2(0.994) - (uFocus + (vec2(1.0) - uFocus) * cover);
    uv += clamp(uParallax, minOffset, maxOffset);

    vec2 disp = vec2(0.0);
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = uRipples[i];
      if (r.w <= 0.0) continue;
      float age = uTime - r.z;
      vec2 toP = (vScreen - r.xy) * vec2(uAspect, 1.0);
      float dist = length(toP);
      float front = age * 0.4;
      float ring = sin((dist - front) * 14.0) * exp(-abs(dist - front) * 4.5);
      float amp = ring * exp(-age * 2.2) * r.w * 0.0035;
      disp += (dist > 1e-4 ? toP / dist : vec2(0.0)) * amp;
    }
    uv = clamp(uv + disp, vec2(0.006), vec2(0.994));

    vec3 col = texture2D(uSkyPhoto, uv).rgb;
    vec3 luma = vec3(0.2126, 0.7152, 0.0722);
    vec3 peach = vec3(1.0, 0.702, 0.478);
    peach *= dot(col, luma) / max(dot(peach, luma), 0.001);
    float warm = clamp(uTopWarm, 0.0, 1.0) * smoothstep(0.55, 1.0, vUv.y);
    col = mix(col, peach, warm);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/** Photo sky backdrop; the equirect sky remains the environment light, with mid/near cloud billboards for parallax. */
export function SkyDome({ animate, mouseRef, counts }: { animate: boolean; mouseRef: RefObject<MouseState>; counts: readonly number[] }) {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const portrait = size.width / Math.max(1, size.height) < 1;
  const sky = useTexture(SKY_TEXTURE_URL, (tex) => {
    tex.mapping = EquirectangularReflectionMapping;
    tex.colorSpace = SRGBColorSpace;
  });
  const skyPhoto = useTexture(portrait ? HERO_SKY_PORTRAIT_URL : HERO_SKY_URL, (tex) => {
    tex.colorSpace = SRGBColorSpace;
  });
  const cloudTextureUrls = useMemo(() => (portrait ? [CLOUD_PHOTO_URLS[0]] : [...CLOUD_PHOTO_URLS]), [portrait]);
  const cloudTextures = useTexture(cloudTextureUrls, (textures) => {
    (textures as Texture[]).forEach((t) => {
      t.colorSpace = SRGBColorSpace;
    });
  }) as Texture[];
  const groups = useRef<(Group | null)[]>([]);
  const clouds = useMemo(() => buildClouds(counts, portrait), [counts, portrait]);
  const cloudUniforms = useMemo(
    () =>
      clouds.map((c) => ({
        uMap: { value: cloudTextures[c.tex] },
        uTint: { value: new Color(LAYERS[c.layer].tint).multiplyScalar(1.12) },
        uOpacity: { value: c.alpha },
      })),
    [clouds, cloudTextures],
  );
  const scroll = useRef(0);
  // Stable uniform objects (mutated per frame, never re-created): a lazily initialised state.
  const [uniforms] = useState<SkyUniforms>(() => ({
    uSkyPhoto: { value: skyPhoto },
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uResolution: { value: new Vector2(1, 1) },
    uImageAspect: { value: 1 },
    uFocus: { value: new Vector2(0.4, 0.5) },
    uParallax: { value: new Vector2() },
    uTopWarm: { value: 0 },
    uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new Vector4(0, 0, 0, 0)) },
  }));
  const ripple = useRef({ next: 0, last: new Vector2(10, 10), lastSpawn: 0, time: 0 });
  const cameraDirection = useMemo(() => new Vector3(), []);

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

  useFrame(({ size, gl, camera }, delta) => {
    scroll.current = typeof window === "undefined" ? 0 : window.scrollY / Math.max(1, window.innerHeight);
    // Per-frame updates go through the material ref (the `uniforms` object above is only the initial value).
    const uniforms = skyMaterial.current?.uniforms as SkyUniforms | undefined;
    if (!uniforms) return;
    uniforms.uSkyPhoto.value = skyPhoto;
    uniforms.uAspect.value = size.width / Math.max(1, size.height);
    gl.getDrawingBufferSize(uniforms.uResolution.value);
    const image = skyPhoto.image as { width: number; height: number };
    uniforms.uImageAspect.value = image.width / Math.max(1, image.height);
    uniforms.uFocus.value.set(portrait ? 0.35 : 0.4, portrait ? 0.35 : 0.5);
    camera.getWorldDirection(cameraDirection);
    uniforms.uParallax.value.set(
      Math.atan2(cameraDirection.x, -cameraDirection.z) * 0.04,
      Math.asin(MathUtils.clamp(cameraDirection.y, -1, 1)) * 0.04,
    );
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
    if (moved > 0.006 && r.time - r.lastSpawn > 0.12) {
      const speed = Math.min(1, moved / Math.max(1e-3, delta) / 2.5);
      uniforms.uRipples.value[r.next].set((m.target.x + 1) / 2, (m.target.y + 1) / 2, r.time, 0.25 + speed * 0.5);
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
      const layer = LAYERS[c.layer];
      g.position.set(c.x - mx * layer.parallax * 1.6, c.y + scroll.current * layer.parallax * 6 - my * layer.parallax, c.z);
      g.rotation.z = Math.sin(t * 0.05 + i) * 0.01;
    });
  }, animate);

  return (
    <group>
      <mesh renderOrder={-20} frustumCulled={false}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial ref={skyMaterial} vertexShader={SKY_VERTEX} fragmentShader={SKY_FRAGMENT} uniforms={uniforms} depthTest={false} depthWrite={false} toneMapped={false} />
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
            <shaderMaterial
              vertexShader={CLOUD_VERTEX}
              fragmentShader={CLOUD_FRAGMENT}
              uniforms={cloudUniforms[i]}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

useTexture.preload(SKY_TEXTURE_URL);
