"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3, type PerspectiveCamera } from "three";
import { HERO_CAMERA_Z } from "./constants";
import { getScreenWorld } from "./desk";
import type { MouseState } from "./mouse";
import { screenFraming } from "./zoomFraming";
import { ZOOM, getZoomProgress } from "@/lib/hero/zoom";

const BASE_FOV = 45;
const MIN_HALF_WIDTH = 2.3;
/** Camera distance from the screen at the end of the orbit (ZOOM.orbitEnd), as a multiple of the final distance. */
const MID_DISTANCE_FACTOR = 5;
/** Time constant (s) of the per-frame damping of the scroll progress. */
const PROGRESS_TAU = 0.07;

const Y_UP = new Vector3(0, 1, 0);
const ORIGIN = new Vector3(0, 0, 0);

/** GSAP's power2.inOut. */
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Applies the fov clamp for portrait screens, the lerped mouse parallax, and drives the camera along the
 * hero zoom (progress from `src/lib/hero/zoom.ts`): 0 = hero composition, 0→orbitEnd = dolly + orbit toward
 * the laptop screen along its normal, orbitEnd→handoverStart = straight zoom until the screen covers the viewport (held until 1).
 */
export function CameraRig({ parallax, mouseRef }: { parallax: boolean; mouseRef: RefObject<MouseState> }) {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);

  useEffect(() => {
    const camera = get().camera as PerspectiveCamera;
    const halfHeight = HERO_CAMERA_Z * Math.tan(MathUtils.degToRad(BASE_FOV / 2));
    const halfWidth = halfHeight * aspect;
    camera.fov =
      halfWidth < MIN_HALF_WIDTH ? MathUtils.radToDeg(2 * Math.atan(MIN_HALF_WIDTH / aspect / HERO_CAMERA_Z)) : BASE_FOV;
    camera.updateProjectionMatrix();
  }, [get, aspect]);

  // Contract values are read at runtime (desk.ts), only cached per aspect.
  const screen = useMemo(() => {
    const { center, normal } = getScreenWorld(aspect);
    const up = Y_UP.clone().addScaledVector(normal, -normal.y).normalize();
    return { center, normal, up };
  }, [aspect]);

  const state = useRef({ progress: 0, parallax: new Vector3() });
  const tmp = useMemo(
    () => ({ pos: new Vector3(), look: new Vector3(), up: new Vector3(), start: new Vector3(), mid: new Vector3() }),
    [],
  );

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const s = state.current;
    const cam = camera as PerspectiveCamera;

    // Mouse parallax (only while the hero composition is shown).
    const m = mouseRef.current;
    if (m && parallax) {
      const k = 1 - Math.exp(-delta * 3);
      s.parallax.x += (m.current.x * 0.28 * m.strength - s.parallax.x) * k;
      s.parallax.y += (m.current.y * 0.16 * m.strength - s.parallax.y) * k;
    }

    // Scroll progress, damped so Lenis/anchor jumps never snap the camera.
    s.progress = MathUtils.lerp(s.progress, getZoomProgress(), 1 - Math.exp(-delta / PROGRESS_TAU));
    const p = s.progress < 0.0005 ? 0 : s.progress > 0.9995 ? 1 : s.progress;

    const { center, normal, up } = screen;
    const framing = screenFraming(aspect, cam.fov);
    const dEnd = framing.distance;
    const dMid = dEnd * MID_DISTANCE_FACTOR;

    if (p <= ZOOM.orbitEnd) {
      const e = easeInOut(clamp01(p / ZOOM.orbitEnd));
      tmp.start.set(s.parallax.x, s.parallax.y, HERO_CAMERA_Z);
      tmp.mid.copy(center).addScaledVector(normal, dMid);
      tmp.pos.lerpVectors(tmp.start, tmp.mid, e);
      tmp.look.lerpVectors(ORIGIN, center, e);
      tmp.up.lerpVectors(Y_UP, up, e).normalize();
    } else {
      // The final framing is reached at handoverStart and held while the DOM crossfades in.
      const e = easeInOut(clamp01((p - ZOOM.orbitEnd) / (ZOOM.handoverStart - ZOOM.orbitEnd)));
      // Exponential dolly: the screen grows at a steady visual rate instead of exploding at the end.
      const d = dMid * Math.pow(dEnd / dMid, e);
      tmp.pos.copy(center).addScaledVector(normal, d);
      tmp.look.copy(center);
      tmp.up.copy(up);
    }

    cam.position.copy(tmp.pos);
    cam.up.copy(tmp.up);
    cam.lookAt(tmp.look);
  });

  return null;
}
