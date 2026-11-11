"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { Group, MathUtils } from "three";
import { HERO_CAMERA_Z, heroFocusFor } from "../hero/constants";
import { useCanHover, useIsMobile, usePrefersReducedMotion } from "../hero/useHeroMotion";
import { Avatar } from "./Avatar";
import type { AvatarClip } from "./clips";
import { AVATAR_ANCHORS, getManifestoProgress } from "@/lib/avatar/story";
import { useWebGL } from "../useWebGL";
import { ActivityPause } from "../ActivityPause";

/** Camera of this layer: z and fov decide how a pixel rectangle maps to world units. */
const LAYER_Z = 10;
const LAYER_FOV = 30;
const LAYER_HALF_H = LAYER_Z * Math.tan(MathUtils.degToRad(LAYER_FOV / 2));
/** Height of the standing model in world units (feet at the group origin). */
const MODEL_HEIGHT = 1.8;
/** Hero scene camera (see hero/CameraRig.tsx): used to project the focus point to the screen. */
const HERO_BASE_FOV = 45;
const HERO_MIN_HALF_WIDTH = 2.3;

type Pose = { x: number; y: number; px: number; rotY: number; clip: AvatarClip; visible: boolean };

const anchor = (name: string) => document.querySelector<HTMLElement>(`[data-avatar-anchor="${name}"]`);

/** Screen position (px) of the hero focus point for the current hero rect, mirroring CameraRig's fov clamp. */
function heroFocusOnScreen(rect: DOMRect) {
  const aspect = rect.width / Math.max(1, rect.height);
  let halfH = HERO_CAMERA_Z * Math.tan(MathUtils.degToRad(HERO_BASE_FOV / 2));
  let halfW = halfH * aspect;
  if (halfW < HERO_MIN_HALF_WIDTH) {
    halfW = HERO_MIN_HALF_WIDTH;
    halfH = halfW / aspect;
  }
  const [fx, fy] = heroFocusFor(aspect);
  return {
    x: rect.left + rect.width * (0.5 + fx / (2 * halfW)),
    y: rect.top + rect.height * (0.5 - fy / (2 * halfH)),
    px: (MODEL_HEIGHT / (2 * halfH)) * rect.height,
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function Rig({ reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  const group = useRef<Group>(null);
  const { size, invalidate } = useThree();
  const [clip, setClip] = useState<AvatarClip>("SitIdle");
  const [visible, setVisible] = useState(true);
  const lastScroll = useRef({ y: 0, t: 0, speed: 0 });
  const walking = useRef(false);
  const clipRef = useRef<AvatarClip>("SitIdle");
  const visibleRef = useRef(true);

  const compute = (now: number): Pose => {
    const H = window.innerHeight;
    const W = window.innerWidth;
    const hero = anchor(AVATAR_ANCHORS.hero)?.getBoundingClientRect();
    const band = anchor(AVATAR_ANCHORS.band)?.getBoundingClientRect();
    const journey = anchor(AVATAR_ANCHORS.journey)?.getBoundingClientRect();

    // Scroll speed with hysteresis → Walk vs Idle inside the manifesto band.
    const y = window.scrollY;
    const dt = Math.max(1, now - lastScroll.current.t);
    if (dt > 40) {
      const speed = (Math.abs(y - lastScroll.current.y) / dt) * 1000;
      lastScroll.current = { y, t: now, speed };
      if (speed > 60) walking.current = true;
      else if (speed < 25) walking.current = false;
    }

    if (hero && hero.bottom > 0) {
      const focus = heroFocusOnScreen(hero);
      const sit = { x: focus.x, y: focus.y, px: focus.px * 1.05, rotY: -0.35, clip: "SitIdle" as AvatarClip, visible: true };
      if (!band || reduced) return sit;
      // Hero → manifesto: stand up and walk to the start of the band.
      const t = clamp01((H - hero.bottom) / (H * 0.6));
      if (t <= 0) return sit;
      const start = bandPose(band, 0, H, W);
      return {
        x: lerp(sit.x, start.x, t),
        y: lerp(sit.y, start.y, t),
        px: lerp(sit.px, start.px, t),
        rotY: lerp(-0.35, 0.4, t),
        clip: t < 1 ? "Walk" : "Idle",
        visible: true,
      };
    }

    if (band && band.bottom > -H * 0.2 && band.top < H * 1.2 && (!journey || journey.top > H * 0.9)) {
      const pinned = !mobile && !reduced;
      const p = pinned ? getManifestoProgress() : clamp01((H - band.top) / (H * 0.9));
      const pose = bandPose(band, p, H, W);
      const settled = p > 0.92 || p < 0.04;
      const clip: AvatarClip = reduced || settled || !walking.current ? "Idle" : "Walk";
      return { ...pose, rotY: settled ? 0.35 : 0.5, clip, visible: true };
    }

    if (journey && journey.bottom > 0 && journey.top < H) {
      const px = Math.min(journey.height * 0.9, H * 0.42);
      return {
        x: journey.left + journey.width / 2,
        y: journey.top + journey.height * 0.95,
        px,
        rotY: -0.25,
        clip: journey.top < H * 0.55 ? "Wave" : "Idle",
        visible: true,
      };
    }

    return { x: 0, y: 0, px: 0, rotY: 0, clip: clipRef.current, visible: false };
  };

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const pose = compute(performance.now());
    if (pose.clip !== clipRef.current) {
      clipRef.current = pose.clip;
      setClip(pose.clip);
    }
    if (pose.visible !== visibleRef.current) {
      visibleRef.current = pose.visible;
      setVisible(pose.visible);
    }
    if (!pose.visible) return;
    const halfW = LAYER_HALF_H * (size.width / Math.max(1, size.height));
    const wx = ((pose.x / size.width) * 2 - 1) * halfW;
    const wy = -((pose.y / size.height) * 2 - 1) * LAYER_HALF_H;
    const scale = ((pose.px / size.height) * 2 * LAYER_HALF_H) / MODEL_HEIGHT;
    const k = reduced ? 1 : 1 - Math.exp(-delta * 14);
    g.position.x = lerp(g.position.x, wx, k);
    g.position.y = lerp(g.position.y, wy, k);
    g.scale.setScalar(lerp(g.scale.x || scale, scale, k));
    g.rotation.y = lerp(g.rotation.y, pose.rotY, k);
  });

  useEffect(() => {
    if (!reduced) return;
    // Demand mode: render a few frames so the frozen pose of the new clip is drawn.
    let frames = 4;
    let raf = 0;
    const tick = () => {
      invalidate();
      if (--frames > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, clip, invalidate]);

  useEffect(() => {
    if (!reduced) return;
    const kick = () => invalidate();
    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, [reduced, invalidate]);

  return (
    <group ref={group} visible={visible}>
      <Avatar clip={clip} timeScale={clip === "Walk" ? 1.15 : 1} crossFade={0.3} />
      {!mobile && (
        <ContactShadows position={[0, 0.002, 0]} opacity={0.35} scale={3.2} blur={2.4} far={1.6} color="#6B4A3A" frames={reduced ? 1 : 90} />
      )}
    </group>
  );
}

/** Pose along the manifesto stage strip (feet on the promises' top rule): walks from the left edge to the right edge as p goes 0 → 1. */
function bandPose(band: DOMRect, p: number, H: number, W: number) {
  const px = Math.min(band.height * 1.35, H * 0.4, W * 0.5);
  const t = clamp01((p - 0.08) / 0.84);
  const halfModelW = px * 0.2;
  const inset = Math.min(band.width * 0.04, 48);
  return {
    x: lerp(band.left + inset + halfModelW, band.right - inset - halfModelW, t),
    y: band.bottom,
    px,
  };
}


/**
 * One fixed, transparent, pointer-transparent canvas that holds the only avatar instance on the page.
 * Each frame it reads the `[data-avatar-anchor]` rects (hero focus, manifesto band, journey) and
 * moves/scales the model so it appears to sit, walk and wave inside the DOM layout.
 */
export function AvatarLayer() {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const hover = useCanHover();
  const webgl = useWebGL();
  const [tabVisible, setTabVisible] = useState(true);
  const [onPage, setOnPage] = useState(true);

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    // Pause the canvas once every anchor is above the viewport (footer and beyond).
    const anchors = Array.from(document.querySelectorAll<HTMLElement>("[data-avatar-anchor]"));
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target, e.isIntersecting));
        setOnPage(Array.from(seen.values()).some(Boolean));
      },
      { rootMargin: "60% 0px 60% 0px" },
    );
    anchors.forEach((a) => io.observe(a));
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
    };
  }, []);

  const frameloop = useMemo(() => (reduced ? "demand" : tabVisible && onPage ? "always" : "never"), [reduced, tabVisible, onPage]);

  // Under prefers-reduced-motion the hero shows the static poster instead (see Hero.tsx).
  if (!webgl || reduced) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40">
      <Canvas
        dpr={[1, mobile ? 1.25 : 1.5]}
        frameloop={frameloop}
        camera={{ position: [0, 0, LAYER_Z], fov: LAYER_FOV, near: 0.1, far: 40 }}
        gl={{ antialias: hover, alpha: true, powerPreference: "high-performance" }}
        // R3F's wrapper sets its own `pointer-events`; the fixed canvas must never swallow clicks.
        className="pointer-events-none!"
        style={{ background: "transparent", pointerEvents: "none" }}
        fallback={null}
      >
        <ambientLight intensity={0.6} color="#FFE4C4" />
        <directionalLight position={[2.5, 4, 3]} intensity={2.2} color="#FFC145" />
        <directionalLight position={[-3, 2.5, -2.5]} intensity={1.3} color="#FF7A1A" />
        <hemisphereLight intensity={0.5} color="#FFF4E6" groundColor="#6B4A3A" />
        <ActivityPause frameloop={frameloop} />
        <Suspense fallback={null}>
          <Rig reduced={reduced} mobile={mobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
