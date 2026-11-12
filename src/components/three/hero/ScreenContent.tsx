"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, LinearFilter, Mesh, NoColorSpace, ShaderMaterial, Vector4, type Material, type PerspectiveCamera } from "three";
import { SCREEN_SIZE } from "./desk";
import { screenFraming } from "./zoomFraming";
import { PALETTE } from "./constants";
import { ScrollTrigger } from "@/lib/motion/gsap";
import { ZOOM, ZOOM_PAGE_ATTR, getZoomProgress } from "@/lib/hero/zoom";
import { paintPage } from "@/lib/hero/paintPage";

export const SCREEN_MESH_NAME = "laptop-screen";
const MAX_TEXTURE = 2048;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Raw output on purpose (no tone mapping / colour conversion): the cream must match the CSS cream exactly at handover.
const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform float uChrome;
  uniform float uTime;
  uniform float uShift;
  uniform float uAspect;
  uniform vec4 uCaret;
  varying vec2 vUv;

  void main() {
    vec3 col = texture2D(uMap, vec2(vUv.x, vUv.y + uShift)).rgb;

    vec2 g = vUv * vec2(uAspect, 1.0) * 16.0;
    vec2 d = abs(fract(g) - 0.5);
    float line = 1.0 - smoothstep(0.0, 0.08, min(d.x, d.y));
    vec3 gold = vec3(1.0, 0.757, 0.271);
    col = mix(col, gold, line * 0.16 * uChrome);

    float glare = smoothstep(0.9, 0.0, distance(vUv, vec2(0.15, 0.95))) * 0.1 * uChrome;
    col += glare;

    if (uCaret.w > 0.5) {
      float blink = step(0.5, fract(uTime * 1.1));
      float inX = step(abs(vUv.x - uCaret.x - 0.006), 0.004);
      float inY = step(abs(vUv.y - (uCaret.y - uShift)), uCaret.z);
      col = mix(col, vec3(1.0, 0.478, 0.102), inX * inY * blink * uChrome);
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

/** The block to paint: the pinned element inside `[data-zoom-page]` (ScrollTrigger may wrap it in a spacer). */
function pageElement() {
  const root = document.querySelector<HTMLElement>(`[${ZOOM_PAGE_ATTR}]`);
  if (!root) return null;
  return root.querySelector<HTMLElement>(":scope > .pin-spacer > *") ?? (root.firstElementChild as HTMLElement | null) ?? root;
}

/**
 * Gives the `laptop-screen` mesh a live texture of "the next page": the manifesto block
 * (`[data-zoom-page]`) painted with its real layout, so that the DOM can take over invisibly at progress 1.
 * The page slides up on the screen as the real manifesto approaches the viewport top (read every frame).
 */
export function ScreenContent() {
  const scene = useThree((s) => s.scene);
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const gfx = useRef<{ canvas: HTMLCanvasElement; texture: CanvasTexture; material: ShaderMaterial } | null>(null);
  const mesh = useRef<{ target: Mesh; original: Material | Material[] } | null>(null);
  /** Visible fraction of the texture (UV) and CSS px per UV, set by `repaint`, read per frame. */
  const mapping = useRef({ u0: 0, v1: 1, fu: 1, fv: 1 });

  const stale = useRef(false);
  const repaintRef = useRef(() => {});

  useEffect(() => {
    let frame = 0;
    let cancelled = false;
    const repaint = () => {
      if (!gfx.current) return;
      const { canvas, texture, material } = gfx.current;
      // Deep in the page the manifesto is mid-animation: repaint when the zoom comes back instead.
      if (getZoomProgress() >= 1) {
        stale.current = true;
        return;
      }
      stale.current = false;
      const page = pageElement();
      const camera = get().camera as PerspectiveCamera;
      const vw = size.width;
      const vh = Math.max(1, size.height);
      const { visible } = screenFraming(vw / vh, camera.fov);
      const fu = visible.u1 - visible.u0;
      const fv = visible.v1 - visible.v0;
      const s = Math.min(dpr, 2);
      const k = Math.min(1, MAX_TEXTURE / Math.max((vw * s) / fu, (vh * s) / fv));
      const tw = Math.max(2, Math.round(((vw * s) / fu) * k));
      const th = Math.max(2, Math.round(((vh * s) / fv) * k));
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = PALETTE.cream;
      ctx.fillRect(0, 0, tw, th);
      mapping.current = { u0: visible.u0, v1: visible.v1, fu, fv };
      material.uniforms.uCaret.value.set(0, 0, 0, 0);
      if (page) {
        // Page px → texture px: the viewport (vw × vh) maps onto the visible part of the screen.
        const sx = (tw * fu) / vw;
        const sy = (th * fv) / vh;
        ctx.setTransform(sx, 0, 0, sy, tw * visible.u0, th * (1 - visible.v1));
        const painted = paintPage(ctx, page, vh * 1.2);
        if (painted.caret) {
          const c = painted.caret;
          material.uniforms.uCaret.value.set(
            visible.u0 + (c.x / vw) * fu,
            visible.v1 - (c.y / vh) * fv,
            ((c.height / vh) * fv) / 2,
            1,
          );
        }
      }
      texture.needsUpdate = true;
    };
    repaintRef.current = repaint;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(repaint);
    };
    document.fonts.ready.then(() => {
      if (!cancelled) schedule();
    });
    schedule();
    ScrollTrigger.addEventListener("refresh", schedule);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      ScrollTrigger.removeEventListener("refresh", schedule);
    };
  }, [get, size, dpr]);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 2;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = NoColorSpace;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.anisotropy = 4;
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uMap: { value: texture },
        uChrome: { value: 1 },
        uTime: { value: 0 },
        uShift: { value: 0 },
        uAspect: { value: SCREEN_SIZE.width / SCREEN_SIZE.height },
        uCaret: { value: new Vector4(0, 0, 0, 0) },
      },
    });
    gfx.current = { canvas, texture, material };
    stale.current = true;
    return () => {
      if (mesh.current) mesh.current.target.material = mesh.current.original;
      mesh.current = null;
      gfx.current = null;
      material.dispose();
      texture.dispose();
    };
  }, []);

  useFrame((_, delta) => {
    if (!gfx.current) return;
    const { material } = gfx.current;
    // The screen mesh may come from a lazily loaded GLB: keep looking until it is there.
    if (!mesh.current || !mesh.current.target.parent) {
      const found = scene.getObjectByName(SCREEN_MESH_NAME);
      if (found instanceof Mesh) {
        mesh.current = { target: found, original: found.material };
        found.material = material;
      } else {
        mesh.current = null;
        return;
      }
    }
    const p = getZoomProgress();
    const u = material.uniforms;
    u.uTime.value += Math.min(delta, 0.05);
    u.uChrome.value = 1 - smoothstep(ZOOM.screenChromeFade.start, ZOOM.screenChromeFade.end, p);

    // Where the real page currently is: slide the painted page so the DOM takes over exactly at progress 1.
    if (stale.current && p < 1) repaintRef.current();
    const root = document.querySelector<HTMLElement>(`[${ZOOM_PAGE_ATTR}]`);
    let shift = 0;
    if (root) {
      const top = Math.max(0, root.getBoundingClientRect().top);
      const { far, from, to } = ZOOM.pageSlide;
      shift = (top / Math.max(1, size.height)) * (far + (1 - far) * smoothstep(from, to, p)) * mapping.current.fv;
    }
    u.uShift.value = shift;
  });

  return null;
}
