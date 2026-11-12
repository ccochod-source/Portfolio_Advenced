"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ActivityPause } from "../ActivityPause";
import { Canvas, useFrame } from "@react-three/fiber";
import { Vector2 } from "three";
import { CameraRig } from "./CameraRig";
import { CLOUD_COUNT, HERO_CAMERA_Z } from "./constants";
import { DeskScene } from "./DeskScene";
import { HeroSceneFallback } from "./HeroSceneFallback";
import type { MouseState } from "./mouse";
import { ScreenContent } from "./ScreenContent";
import { SkyDome } from "./SkyDome";
import { useCanHover, useIsMobile, usePrefersReducedMotion } from "./useHeroMotion";
import { useWebGL } from "../useWebGL";
import { subscribeZoom, getZoomProgress } from "@/lib/hero/zoom";

export { HERO_FOCUS_POSITION, HERO_FOCUS_POSITION_PORTRAIT, heroFocusFor } from "./constants";
export { HeroSceneFallback } from "./HeroSceneFallback";

export type HeroSceneProps = {
  className?: string;
  /** Force reduced motion (static frame). Defaults to the `prefers-reduced-motion` media query. */
  reducedMotion?: boolean;
  /** Called once the first WebGL frame has been rendered. */
  onReady?: () => void;
};

function ReadySignal({ onReady }: { onReady?: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    onReady?.();
  });
  return null;
}

export function HeroScene({ className = "", reducedMotion, onReady }: HeroSceneProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const prefersReduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const canHover = useCanHover();
  const reduced = reducedMotion ?? prefersReduced;

  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const supported = useWebGL();
  const [webgl, setWebgl] = useState(true);
  // Once the zoom has handed over to the DOM the (invisible) hero canvas stops rendering.
  const [covered, setCovered] = useState(() => getZoomProgress() >= 1);
  useEffect(() => subscribeZoom((p) => setCovered(p >= 1)), []);

  const mouseRef = useRef<MouseState>({
    target: new Vector2(10, 10),
    current: new Vector2(10, 10),
    strength: 0,
    targetStrength: 0,
  });

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!canHover || reduced) {
      mouseRef.current.targetStrength = 0;
      return;
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouseRef.current.target.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      mouseRef.current.targetStrength = 1;
    };
    const onLeave = () => {
      mouseRef.current.targetStrength = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [canHover, reduced]);

  const handleCreated = useCallback(({ gl }: { gl: { domElement: HTMLCanvasElement } }) => {
    gl.domElement.addEventListener("webglcontextlost", () => setWebgl(false), { once: true });
  }, []);

  const animate = !reduced;
  const running = animate && inView && tabVisible && !covered;
  const frameloop = reduced ? "demand" : running ? "always" : "never";
  const counts = isMobile ? CLOUD_COUNT.mobile : CLOUD_COUNT.desktop;

  return (
    <div ref={wrapper} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <HeroSceneFallback />
      {supported && webgl && (
        <Canvas
          className="absolute inset-0"
          dpr={[1, 1.5]}
          frameloop={frameloop}
          camera={{ position: [0, 0, HERO_CAMERA_Z], fov: 45, near: 0.02, far: 40 }}
          gl={{ antialias: !isMobile, alpha: false, powerPreference: "high-performance" }}
          onCreated={handleCreated}
          fallback={null}
        >
          <ActivityPause frameloop={frameloop} />
          <Suspense fallback={null}>
            <SkyDome animate={animate} mouseRef={mouseRef} counts={counts} />
            {/* Under reduced motion the hero shows the static poster of the set instead (see Hero.tsx). */}
            {!reduced && <DeskScene />}
            {!reduced && <ScreenContent />}
          </Suspense>
          <CameraRig parallax={animate && canHover} mouseRef={mouseRef} />
          <ReadySignal onReady={onReady} />
        </Canvas>
      )}
    </div>
  );
}
