"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { Group, MathUtils } from "three";
import { useCanHover, useIsMobile, usePrefersReducedMotion } from "../hero/useHeroMotion";
import { Avatar } from "./Avatar";
import { WALK_CYCLE_S, WALK_STRIDE_M, type AvatarClip } from "./clips";
import { AVATAR_TARGETS, STORY, getManifestoProgress, type AvatarSegment } from "@/lib/avatar/story";
import { MEDIA } from "@/lib/motion/ease";
import { useWebGL } from "../useWebGL";
import { ActivityPause } from "../ActivityPause";

/** Camera of this layer: z and fov decide how a pixel rectangle maps to world units. */
const LAYER_Z = 10;
const LAYER_FOV = 30;
const LAYER_HALF_H = LAYER_Z * Math.tan(MathUtils.degToRad(LAYER_FOV / 2));
/** Height of the standing model in world units (feet at the group origin). */
const MODEL_HEIGHT = 1.8;
/** Facing while walking: ±90° would be a pure profile, this keeps a readable three-quarter view. */
const WALK_YAW = Math.PI / 2 - 0.4;
const SHADOW_OPACITY = 0.35;
const CROSS_FADE = 0.5;
/** Marks the canvas wrapper whose CSS opacity fades the whole layer. */
const FADE_ATTR = "data-avatar-fade";
/** Walk ⇄ Idle blends are quick so the character stops with the scroll instead of walking in place. */
const WALK_FADE = 0.25;
/** Ground speed covered by the Walk clip at time scale 1. */
const WALK_CLIP_SPEED = WALK_STRIDE_M / WALK_CYCLE_S;
/**
 * Walking speed range (m/s, model units): the avatar chases its scroll-driven spot at a speed kept inside it, and the
 * Walk clip plays at exactly that speed, so the feet stay planted however fast or slow the page is scrolled.
 */
const WALK_SPEED_MIN = 0.35 * WALK_CLIP_SPEED;
const WALK_SPEED_MAX = 2.4 * WALK_CLIP_SPEED;
/** Time (s) in which the avatar would close its gap to the spot: gap / CHASE_TAU is the speed it asks for. */
const CHASE_TAU = 0.3;
/** Time constant (s) of the speed changes (acceleration / braking / turning round). */
const ACCEL_TAU = 0.12;
/** Gap (m) below which a standing avatar does not bother to take a step. */
const STEP_DEADZONE = 0.05;

/** Where the avatar should be this frame, in CSS pixels of the viewport (y = ground line under the feet). */
type Target = {
  seg: AvatarSegment;
  x: number;
  y: number;
  /** Height of the standing model in px. */
  h: number;
  alpha: number;
  /** Yaw when standing still. */
  idleYaw: number;
  /** Whether horizontal motion along this segment should read as walking. */
  walkable: boolean;
};

type Rects = Partial<Record<keyof typeof AVATAR_TARGETS, DOMRect>>;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 0..1 progress of `v` between `from` and `to` (works for decreasing ranges too). */
const range = (v: number, from: number, to: number) => clamp01((v - from) / (to - from));
const smooth = (t: number) => t * t * (3 - 2 * t);
/** Frame-rate independent exponential damping. */
const damp = (current: number, target: number, tau: number, dt: number) => lerp(current, target, 1 - Math.exp(-dt / tau));

function readRects(): Rects {
  const rects: Rects = {};
  (Object.keys(AVATAR_TARGETS) as (keyof typeof AVATAR_TARGETS)[]).forEach((key) => {
    const el = document.querySelector<HTMLElement>(AVATAR_TARGETS[key]);
    // `getClientRects` is empty for display:none (offsetParent is null inside a pinned, fixed section).
    if (el && el.getClientRects().length > 0) rects[key] = el.getBoundingClientRect();
  });
  return rects;
}

const hidden = (seg: AvatarSegment = "none"): Target => ({ seg, x: 0, y: 0, h: 1, alpha: 0, idleYaw: 0, walkable: false });

/**
 * Pose along the manifesto band: feet on the band's bottom rule, walking right → left as `t` goes 0 → 1
 * (it walks in from beyond the band's right edge, where the manifesto has no copy, and ends under the intro text).
 * The model shrinks along the way so that it never overlaps the intro copy above the band's left half.
 */
function bandPose(band: DOMRect, t: number, H: number, narrow: boolean) {
  const hStart = Math.min(band.height * (narrow ? 0.95 : 1.35), H * 0.32);
  const hEnd = Math.min(band.height * 0.95, H * 0.28);
  const h = lerp(hStart, hEnd, t);
  const inset = Math.min(band.width * 0.05, 56) + h * 0.22;
  return { x: lerp(band.right + h * 0.6, band.left + inset, t), y: band.bottom, h };
}

/** Standing spot next to the journey timeline: centred on the anchor, feet on the timeline's top rule. */
function journeySpot(anchor: DOMRect, track: DOMRect, H: number) {
  const h = Math.min(anchor.height * 0.92, H * 0.36, anchor.width * 1.4);
  return { x: anchor.left + anchor.width / 2, y: track.top, h };
}

/** Standing spot next to the contact headline: in the free space right of it, feet on its last line. */
function contactSpot(contact: DOMRect, W: number, H: number) {
  const free = W - contact.right;
  const h = Math.min(H * 0.34, free * 0.7);
  return { x: contact.right + free / 2, y: contact.bottom, h, ok: free > 170 };
}

type Env = { W: number; H: number; narrow: boolean; pinnedBandTop: number | null };

/** Pure mapping from the DOM rects (and scroll) to the target pose. Every segment is continuous with its neighbours. */
function computeTarget(r: Rects, env: Env): Target {
  const { W, H, narrow } = env;
  const offRight = (h: number) => W + h * 0.5;
  const offLeft = (h: number) => -h * 0.5;

  // 1. Manifesto band: walk across while pinned (desktop) or while the band scrolls through (narrow), then walk off right.
  if (r.band) {
    const band = r.band;
    if (narrow) {
      const t = smooth(range(band.bottom / H, STORY.band.narrowFrom, STORY.band.narrowTo));
      const exit = smooth(range(band.bottom / H, STORY.band.narrowTo, STORY.band.narrowExitTo));
      if (band.bottom > H * STORY.band.narrowFrom) return hidden();
      const pose = bandPose(band, t, H, narrow);
      const alphaIn = range(band.bottom / H, STORY.band.narrowFrom, STORY.band.narrowFrom - 0.08);
      if (exit < 1) {
        return { seg: exit > 0 ? "bandExit" : "band", x: lerp(pose.x, offLeft(pose.h), exit), y: pose.y, h: pose.h, alpha: alphaIn, idleYaw: -0.35, walkable: true };
      }
    } else {
      const p = getManifestoProgress();
      const t = smooth(range(p, STORY.band.walkFrom, STORY.band.walkTo));
      const pose = bandPose(band, t, H, narrow);
      const pinnedTop = env.pinnedBandTop ?? Math.min(band.top, H * 0.45);
      const exit = p >= 1 ? smooth(range(band.top, pinnedTop - 2, pinnedTop - H * STORY.band.exitTravel)) : 0;
      if (exit < 1 && band.bottom > -H * 0.1) {
        return { seg: exit > 0 ? "bandExit" : "band", x: lerp(pose.x, offLeft(pose.h), exit), y: pose.y, h: pose.h, alpha: 1, idleYaw: -0.35, walkable: true };
      }
    }
  }

  // 3. Contact (checked before the journey so the two never overlap): walk in from the right of the headline.
  if (r.contact) {
    const footerTop = r.contact.top / H;
    const spot = contactSpot(r.contact, W, H);
    if (narrow) {
      // Stacked layout: the headline spans the full width, so the avatar fades in beside the contact details below it.
      const alpha = smooth(range(footerTop, STORY.contact.narrowFadeFrom, STORY.contact.narrowFadeTo));
      const h = Math.min(H * 0.22, W * 0.45);
      if (alpha > 0) return { seg: "contact", x: W - 24 - h * 0.3, y: r.contact.bottom + H * 0.3, h, alpha, idleYaw: -0.15, walkable: false };
    } else if (spot.ok && footerTop < STORY.contact.enterFrom) {
      const enter = smooth(range(footerTop, STORY.contact.enterFrom, STORY.contact.enterTo));
      return { seg: enter < 1 ? "contactEnter" : "contact", x: lerp(offRight(spot.h), spot.x, enter), y: spot.y, h: spot.h, alpha: 1, idleYaw: -0.15, walkable: true };
    }
  }

  // 2. Journey (desktop only, the anchor is hidden on narrow screens): walk in from the right to the timeline rule,
  //    stand there, walk back off the right edge before the footer arrives.
  if (r.journey && r.journeyTrack && !narrow) {
    const ruleY = r.journeyTrack.top / H;
    if (ruleY < STORY.journey.enterFrom && ruleY > STORY.journey.exitTo) {
      const spot = journeySpot(r.journey, r.journeyTrack, H);
      const enter = smooth(range(ruleY, STORY.journey.enterFrom, STORY.journey.enterTo));
      const exit = smooth(range(ruleY, STORY.journey.exitFrom, STORY.journey.exitTo));
      const x = exit > 0 ? lerp(spot.x, offRight(spot.h), exit) : lerp(offRight(spot.h), spot.x, enter);
      const seg: AvatarSegment = exit > 0 ? "journeyExit" : enter < 1 ? "journeyEnter" : "journey";
      return { seg, x, y: spot.y, h: spot.h, alpha: 1, idleYaw: -0.25, walkable: true };
    }
  }

  return hidden();
}

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(MEDIA.mobile);
    const update = () => setNarrow(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return narrow;
}

/** Segments that follow each other along one continuous walk share a path; the avatar is re-placed between paths. */
const pathOf = (seg: AvatarSegment) => (seg === "none" ? "none" : seg.startsWith("band") ? "band" : seg.startsWith("journey") ? "journey" : "contact");

type Motion = {
  /** Where the avatar actually stands (CSS px), chasing the target at walking speed; null = not placed yet. */
  x: number | null;
  prevSeg: AvatarSegment;
  /** Ground velocity actually applied (CSS px / s, signed). */
  vx: number;
  walking: boolean;
  lastMoving: number;
  settledSince: number;
  waved: boolean;
  celebrated: boolean;
  oneShotDone: boolean;
  pendingClip: AvatarClip | null;
  pendingSince: number;
  pinnedBandTop: number | null;
  /** Last opacity written to the wrapper element. */
  appliedAlpha: number;
};

/**
 * The whole layer fades through the CSS opacity of the canvas wrapper (`FADE_ATTR`), so the model's own materials are
 * never touched. (Cloning them and toggling `transparent` broke the head: the hair cap is an alpha-blended material, and
 * forcing it opaque wrote its transparent fringe into the premultiplied canvas as alpha ≈ 0 — a hole showing the cream
 * page as a white band along the hairline — and turned the glasses' 10 % lenses into solid white.)
 */
function Rig({ mobile, narrow }: { mobile: boolean; narrow: boolean }) {
  const group = useRef<Group>(null);
  const { size, gl } = useThree();
  const fade = useRef<HTMLElement | null>(null);
  useEffect(() => {
    fade.current = gl.domElement.closest<HTMLElement>(`[${FADE_ATTR}]`);
  }, [gl]);
  const [play, setPlay] = useState<{ clip: AvatarClip; fade: number }>({ clip: "Idle", fade: CROSS_FADE });
  const clip = play.clip;
  const clipRef = useRef<AvatarClip>("Idle");
  const walkSpeed = useRef(1);
  const yaw = useRef(-0.35);
  const alpha = useRef(0);
  const m = useRef<Motion>({
    x: null,
    prevSeg: "none",
    vx: 0,
    walking: false,
    lastMoving: 0,
    settledSince: 0,
    waved: false,
    celebrated: false,
    oneShotDone: false,
    pendingClip: null,
    pendingSince: 0,
    pinnedBandTop: null,
    appliedAlpha: -1,
  });

  const onFinished = useCallback(() => {
    m.current.oneShotDone = true;
  }, []);

  /** Switches clip only once the request has held for a short dwell, so the storyline never flickers. */
  const requestClip = (next: AvatarClip, now: number, immediate = false, fadeSec = CROSS_FADE) => {
    const s = m.current;
    if (next === clipRef.current) {
      s.pendingClip = null;
      return;
    }
    if (s.pendingClip !== next) {
      s.pendingClip = next;
      s.pendingSince = now;
    }
    if (!immediate && now - s.pendingSince < 120) return;
    s.pendingClip = null;
    clipRef.current = next;
    setPlay({ clip: next, fade: fadeSec });
  };

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(0.1, Math.max(0.001, delta));
    const now = performance.now();
    const s = m.current;
    const H = size.height;
    const W = size.width;

    const rects = readRects();
    if (!narrow && rects.band) {
      const p = getManifestoProgress();
      if (p > 0.02 && p < 0.98) s.pinnedBandTop = rects.band.top;
    }
    const target = computeTarget(rects, { W, H, narrow, pinnedBandTop: s.pinnedBandTop });

    // The scroll decides where the avatar should be; it gets there on foot. Its x chases the target at a speed kept
    // inside the walking range (a fast scroll leaves it behind, striding; a slow one is followed step by step), and the
    // velocity actually applied drives the Walk clip, so the planted foot never slides.
    const pxPerM = Math.max(1, target.h) / MODEL_HEIGHT;
    const samePath = pathOf(target.seg) === pathOf(s.prevSeg);
    if (target.seg !== s.prevSeg) {
      s.prevSeg = target.seg;
      s.settledSince = now;
      s.oneShotDone = false;
      if (target.seg === "journeyEnter" || target.seg === "journeyExit") s.waved = false;
    }
    // Re-placed without walking when it could not be seen doing it (another path, faded out) or may not walk at all.
    if (s.x === null || !samePath || !target.walkable || alpha.current < 0.02) {
      s.x = target.x;
      s.vx = 0;
    } else {
      const gap = target.x - s.x;
      const dist = Math.abs(gap) / pxPerM;
      const moving = Math.abs(s.vx) / pxPerM > 0.02;
      let wanted = 0;
      if (dist > (moving ? 0 : STEP_DEADZONE)) wanted = Math.sign(gap) * MathUtils.clamp(dist / CHASE_TAU, WALK_SPEED_MIN, WALK_SPEED_MAX) * pxPerM;
      s.vx = damp(s.vx, wanted, ACCEL_TAU, dt);
      const step = s.vx * dt;
      if (wanted !== 0 && Math.sign(step) === Math.sign(gap) && Math.abs(step) >= Math.abs(gap)) {
        // Arrived: stand exactly on the spot.
        s.x = target.x;
        s.vx = 0;
      } else s.x += step;
    }
    const x = s.x;
    // Ground speed in model metres per second (the model is MODEL_HEIGHT tall and target.h px high on screen).
    const speed = Math.abs(s.vx) / pxPerM;
    if (speed > 0.02) {
      s.walking = true;
      s.lastMoving = now;
    } else if (!target.walkable || now - s.lastMoving > 120) {
      s.walking = false;
    }
    if (s.walking) s.settledSince = now;

    // Clip choice: hysteretic along the scroll, one-shots play once.
    let next: AvatarClip = "Idle";
    const settled = now - s.settledSince > 250;
    if (s.walking) {
      next = "Walk";
    } else if (target.seg === "journey") {
      if (clipRef.current === "Wave") {
        if (s.oneShotDone) s.waved = true;
        next = s.waved ? "Idle" : "Wave";
      } else next = !s.waved && settled ? "Wave" : "Idle";
    } else if (target.seg === "contact" && !narrow) {
      if (clipRef.current === "Celebrate") {
        if (s.oneShotDone) s.celebrated = true;
        next = s.celebrated ? "Idle" : "Celebrate";
      } else next = !s.celebrated && settled ? "Celebrate" : "Idle";
    } else if (target.seg === "contact" && narrow) {
      if (clipRef.current === "Celebrate") {
        if (s.oneShotDone) s.celebrated = true;
        next = s.celebrated ? "Idle" : "Celebrate";
      } else next = !s.celebrated && settled && target.alpha > 0.9 ? "Celebrate" : "Idle";
    }
    const walkSwitch = next === "Walk" || clipRef.current === "Walk";
    requestClip(next, now, walkSwitch || s.oneShotDone, walkSwitch ? WALK_FADE : CROSS_FADE);

    // Facing follows the walk direction, otherwise the segment's idle yaw; always turned smoothly.
    const yawTarget = s.walking ? Math.sign(s.vx) * WALK_YAW : target.idleYaw;
    yaw.current = damp(yaw.current, yawTarget, 0.18, dt);

    // Walk playback locked to the ground speed (stride / cycle = distance covered per second at time scale 1),
    // played backwards whenever the body still faces away from the direction of travel (mid-turn) so the planted
    // foot always moves against the ground instead of moonwalking. Facing x = sin(yaw): yaw 0 faces the camera.
    const facingX = Math.sin(yaw.current);
    const forward = facingX * Math.sign(s.vx || 1) >= 0 ? 1 : -1;
    walkSpeed.current = (forward * speed) / WALK_CLIP_SPEED;

    // Visibility: the whole layer fades through the wrapper's CSS opacity (model and contact shadow together, materials
    // untouched so the hair/glasses keep their alpha blending), and rendering is skipped entirely when invisible or
    // outside the viewport.
    alpha.current = damp(alpha.current, target.alpha, 0.12, dt);
    const a = alpha.current;
    if (fade.current && Math.abs(a - s.appliedAlpha) > 0.002) {
      s.appliedAlpha = a;
      fade.current.style.opacity = a >= 0.995 ? "1" : a.toFixed(3);
    }
    const onScreen = x + target.h * 0.5 > 0 && x - target.h * 0.5 < W && target.y > -target.h * 0.1 && target.y - target.h < H * 1.1;
    g.visible = a > 0.01 && onScreen;
    if (!g.visible) return;

    // Screen px → world units: the ground line and size follow the scroll directly, x is the walked position.
    const halfW = LAYER_HALF_H * (W / Math.max(1, H));
    const wx = ((x / W) * 2 - 1) * halfW;
    const wy = -((target.y / H) * 2 - 1) * LAYER_HALF_H;
    const scale = ((target.h / H) * 2 * LAYER_HALF_H) / MODEL_HEIGHT;
    g.position.set(wx, wy, 0);
    g.scale.setScalar(scale);
    g.rotation.y = yaw.current;
  });

  return (
    <group ref={group} visible={false}>
      <Avatar clip={clip} timeScaleRef={clip === "Walk" ? walkSpeed : undefined} crossFade={play.fade} playOnce={clip === "Wave" || clip === "Celebrate"} onFinished={onFinished} />
      {!mobile && <ContactShadows position={[0, 0.002, 0]} opacity={SHADOW_OPACITY} scale={3.2} blur={2.4} far={1.6} color="#6B4A3A" frames={Infinity} />}
    </group>
  );
}

/**
 * One fixed, transparent, pointer-transparent canvas that holds the only avatar instance on the page.
 * Each frame it reads the storyline's DOM rects (manifesto band, journey timeline, contact headline)
 * and moves/scales the model so it appears to walk, wave and celebrate inside the DOM layout.
 * (In the hero the avatar is part of the hero Canvas itself: see hero/DeskScene.tsx.)
 */
export function AvatarLayer() {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const narrow = useNarrow();
  const hover = useCanHover();
  const webgl = useWebGL();
  const [tabVisible, setTabVisible] = useState(true);
  const [onPage, setOnPage] = useState(true);

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    // Pause the canvas once no storyline element is anywhere near the viewport (projects, skills…).
    const targets = Object.values(AVATAR_TARGETS)
      .map((selector) => document.querySelector<HTMLElement>(selector))
      .filter((el): el is HTMLElement => el !== null);
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target, e.isIntersecting));
        setOnPage(Array.from(seen.values()).some(Boolean));
      },
      { rootMargin: "80% 0px 80% 0px" },
    );
    targets.forEach((el) => io.observe(el));
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
    };
  }, []);

  const frameloop = useMemo(() => (tabVisible && onPage ? "always" : "never"), [tabVisible, onPage]);

  // Under prefers-reduced-motion the hero shows the static poster instead (see Hero.tsx).
  if (!webgl || reduced) return null;

  return (
    <div {...{ [FADE_ATTR]: "" }} aria-hidden className="pointer-events-none fixed inset-0 z-40" style={{ opacity: 0 }}>
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
          <Rig mobile={mobile} narrow={narrow} />
        </Suspense>
      </Canvas>
    </div>
  );
}
