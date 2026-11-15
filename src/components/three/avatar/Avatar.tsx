"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { LoopOnce, LoopRepeat, type AnimationAction, type Group, type Mesh } from "three";
import { SkeletonUtils } from "three-stdlib";
import {
  AVATAR_MODEL_URL,
  AVATAR_POSTER_URL,
  type AvatarClip,
  clipForProgress,
} from "./clips";
import { useWebGL } from "../useWebGL";

export type { AvatarClip } from "./clips";
export {
  AVATAR_CLIPS,
  AVATAR_MODEL_URL,
  AVATAR_POSTER_URL,
  clipForProgress,
} from "./clips";

export type AvatarProps = {
  clip: AvatarClip;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  timeScale?: number;
  /** Per-frame time scale override (read inside the render loop, no re-render): walk speed tied to scroll velocity. */
  timeScaleRef?: RefObject<number>;
  /** Cross-fade duration in seconds between two clips (0.4–0.6 s reads as natural). */
  crossFade?: number;
  /** Play the current clip once and hold its last frame, then call `onFinished`. */
  playOnce?: boolean;
  onFinished?: (clip: AvatarClip) => void;
  onLoaded?: () => void;
};

useGLTF.preload(AVATAR_MODEL_URL, false, true);

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Maps a 0..1 scroll progress to the storyline clip (SitIdle → Walk → Idle → Wave). */
export function useAvatarScrollClip(progress: number): AvatarClip {
  return clipForProgress(Math.min(1, Math.max(0, progress)));
}

function prepareAction(action: AnimationAction, playOnce: boolean) {
  action.enabled = true;
  action.reset();
  if (playOnce) {
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
  } else {
    action.setLoop(LoopRepeat, Infinity);
    action.clampWhenFinished = false;
  }
}

function holdAction(action: AnimationAction) {
  action.enabled = true;
  action.setEffectiveTimeScale(action.getEffectiveTimeScale() || 1);
}

export function Avatar({
  clip,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  timeScale = 1,
  timeScaleRef,
  crossFade = 0.5,
  playOnce = false,
  onFinished,
  onLoaded,
}: AvatarProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF(AVATAR_MODEL_URL, false, true);
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, groupRef);
  const reducedMotion = useReducedMotion();
  const onLoadedRef = useRef(onLoaded);
  const onFinishedRef = useRef(onFinished);
  const current = useRef<AnimationAction | null>(null);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
    onFinishedRef.current = onFinished;
  }, [onLoaded, onFinished]);

  useEffect(() => {
    model.traverse((child) => {
      child.frustumCulled = false;
      child.castShadow = true;
    });
    onLoadedRef.current?.();
  }, [model]);

  // Clip changes cross-fade from whatever is playing; the time scale is applied separately so that
  // changing it never restarts the clip.
  useEffect(() => {
    const action = actions[clip];
    if (!action) return;
    const previous = current.current;
    current.current = action;
    prepareAction(action, playOnce);
    if (reducedMotion) {
      // Static pose: jump to a representative frame, then freeze the clip.
      previous?.stop();
      action.setEffectiveWeight(1).setEffectiveTimeScale(1).play();
      mixer.setTime(0.6);
      action.setEffectiveTimeScale(0);
      return () => {
        action.stop();
      };
    }
    action.setEffectiveWeight(1);
    if (previous && previous !== action) {
      // Hold the clip that was playing and blend it out while the new one blends in.
      holdAction(previous);
      previous.fadeOut(crossFade);
      action.fadeIn(crossFade);
    } else {
      action.setEffectiveWeight(1);
    }
    action.play();
    const onMixerFinished = (event: { action: AnimationAction }) => {
      if (event.action === action) onFinishedRef.current?.(clip);
    };
    mixer.addEventListener("finished", onMixerFinished);
    return () => {
      mixer.removeEventListener("finished", onMixerFinished);
    };
  }, [actions, clip, crossFade, mixer, playOnce, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    actions[clip]?.setEffectiveTimeScale(timeScale);
  }, [actions, clip, reducedMotion, timeScale]);

  useFrame(() => {
    if (!timeScaleRef || reducedMotion) return;
    actions[clip]?.setEffectiveTimeScale(timeScaleRef.current ?? 1);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      dispose={null}
    >
      <primitive object={model} />
    </group>
  );
}

/** The stage camera looks at the origin, so the avatar's feet sit below it. */
const AVATAR_FLOOR_Y = -0.92;

type AvatarStageProps = Omit<AvatarProps, "position"> & {
  className?: string;
  /** Distance of the camera from the avatar; smaller = closer. */
  cameraZ?: number;
};

const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const GLOW_FRAG = /* glsl */ `
uniform vec3 uCore;
uniform vec3 uHalo;
uniform float uStrength;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float core = pow(max(0.0, 1.0 - length(p * vec2(1.0, 1.6)) * 1.25), 2.2);
  float halo = pow(max(0.0, 1.0 - r), 2.6);
  float a = clamp(core + halo * 0.55, 0.0, 1.0);
  vec3 col = mix(uHalo, uCore, clamp(core / max(a, 1e-4), 0.0, 1.0));
  gl_FragColor = vec4(col, a * uStrength);
}`;

/**
 * Soft warm pool of light under the feet (replaces the dark contact shadow on the night backdrop).
 * A camera-facing ellipse just behind the feet (the legs occlude it); it ignores the parent's yaw.
 */
export function FootGlow({ strength = 0.8, width = 2.2, height = 0.8, y = 0.04, depth = 0.35 }: { strength?: number; width?: number; height?: number; y?: number; depth?: number }) {
  const mesh = useRef<Mesh>(null);
  const uniforms = useMemo(
    () => ({ uCore: { value: [1.0, 0.62, 0.28] }, uHalo: { value: [1.0, 0.36, 0.22] }, uStrength: { value: strength } }),
    [strength],
  );
  useFrame(() => {
    const m = mesh.current;
    const ry = m?.parent?.rotation.y ?? 0;
    if (!m) return;
    m.rotation.y = -ry;
    m.position.set(depth * -Math.sin(ry), y, -depth * Math.cos(ry));
  });
  return (
    <mesh ref={mesh} renderOrder={-1}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        vertexShader={GLOW_VERT}
        fragmentShader={GLOW_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Canvas with warm key light, sun/coral rim lights and a warm foot glow (tuned for the night backdrop); decorative (aria-hidden). */
export function AvatarStage({
  className = "",
  cameraZ = 3.9,
  ...avatarProps
}: AvatarStageProps) {
  const webgl = useWebGL();
  return (
    <div aria-hidden className={`pointer-events-none ${className}`}>
      {!webgl && <AvatarFallback />}
      {webgl && (
        <Canvas
          dpr={[1, 1.5]}
          shadows="percentage"
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 1.2;
          }}
          camera={{ position: [0, 0.15, cameraZ], fov: 32 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.5} color="#FFD9B8" />
          <directionalLight
            position={[2.5, 3.5, 4]}
            intensity={2.6}
            color="#FFC58A"
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0004}
          />
          <directionalLight position={[-2.6, 2.4, -3.6]} intensity={4} color="#FF7A1A" />
          <directionalLight position={[2.8, 1.6, -3.2]} intensity={2.6} color="#FF5A4E" />
          <hemisphereLight intensity={0.6} color="#FFE4C4" groundColor="#4A2412" />
          <group position={[0, AVATAR_FLOOR_Y, 0]}>
            <Avatar {...avatarProps} />
            <FootGlow />
          </group>
        </Canvas>
      )}
    </div>
  );
}

/** Static poster used while the 3D bundle loads (next/dynamic ssr:false) or when WebGL is unavailable. */
export function AvatarFallback({
  className = "",
  alt = "",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- plain img keeps the fallback dependency-free inside the dynamic loader
    <img
      src={AVATAR_POSTER_URL}
      alt={alt}
      aria-hidden={alt === "" || undefined}
      width={720}
      height={960}
      decoding="async"
      className={`h-full w-full object-contain ${className}`}
    />
  );
}
