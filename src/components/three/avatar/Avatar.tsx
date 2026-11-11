"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, useAnimations, useGLTF } from "@react-three/drei";
import type { Group } from "three";
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
  crossFade?: number;
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

export function Avatar({
  clip,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  timeScale = 1,
  crossFade = 0.4,
  onLoaded,
}: AvatarProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF(AVATAR_MODEL_URL, false, true);
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, groupRef);
  const reducedMotion = useReducedMotion();
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  useEffect(() => {
    model.traverse((child) => {
      child.frustumCulled = false;
      child.castShadow = true;
    });
    onLoadedRef.current?.();
  }, [model]);

  useEffect(() => {
    const action = actions[clip];
    if (!action) return;
    action.reset();
    if (reducedMotion) {
      // Static pose: jump to a representative frame, then freeze the clip.
      action.setEffectiveWeight(1).setEffectiveTimeScale(1).play();
      mixer.setTime(0.6);
      action.setEffectiveTimeScale(0);
      return () => {
        action.stop();
      };
    }
    action.setEffectiveTimeScale(timeScale).fadeIn(crossFade).play();
    return () => {
      action.fadeOut(crossFade);
    };
  }, [actions, clip, crossFade, mixer, reducedMotion, timeScale]);

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

/** Canvas with warm key light, soft rim light and a contact shadow; decorative (aria-hidden). */
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
          shadows
          camera={{ position: [0, 0.15, cameraZ], fov: 32 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.55} color="#FFE4C4" />
          <directionalLight
            position={[2.5, 4, 3]}
            intensity={2.4}
            color="#FFC145"
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0004}
          />
          <directionalLight
            position={[-3, 2.5, -2.5]}
            intensity={1.4}
            color="#FF7A1A"
          />
          <hemisphereLight
            intensity={0.5}
            color="#FFF4E6"
            groundColor="#6B4A3A"
          />
          <Avatar position={[0, AVATAR_FLOOR_Y, 0]} {...avatarProps} />
          <ContactShadows
            position={[0, AVATAR_FLOOR_Y + 0.001, 0]}
            opacity={0.45}
            scale={4}
            blur={2.2}
            far={2}
            color="#6B4A3A"
            frames={Infinity}
          />
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
