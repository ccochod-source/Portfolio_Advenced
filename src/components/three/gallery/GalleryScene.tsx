"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, useTexture } from "@react-three/drei";
import { PlaneGeometry, SRGBColorSpace, type Mesh, type ShaderMaterial, type Texture } from "three";
import { computeLayout, type GalleryLayout } from "@/lib/gallery/layout";
import { gallery } from "@/lib/gallery/store";
import type { GalleryItem } from "@/lib/gallery/types";
import { panelFragment, panelVertex } from "./shaders";

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

type PanelProps = { index: number; item: GalleryItem; texture: Texture; layout: GalleryLayout; geometry: PlaneGeometry };

function Panel({ index, item, texture, layout, geometry }: PanelProps) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const zoom = useRef(1);

  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uImage: { value: [item.cover.width, item.cover.height] },
      uOffset: { value: 0 },
      uR: { value: 1 },
      uW: { value: 1 },
      uH: { value: 1 },
      uStep: { value: 1 },
      uBend: { value: 0 },
      uLift: { value: 0 },
      uExpand: { value: 0 },
      uFull: { value: [1, 1] },
      uAspect: { value: 1 },
      uZoom: { value: 1 },
      uVel: { value: 0 },
      uRadius: { value: 0 },
      uOpacity: { value: 0 },
      uDim: { value: 0 },
      uGrade: { value: 1 },
      uTime: { value: 0 },
    }),
    [texture, item.cover.width, item.cover.height],
  );

  useFrame((state, delta) => {
    const mat = material.current;
    const m = mesh.current;
    if (!mat || !m) return;
    const u = mat.uniforms;
    const dt = Math.min(delta, 0.1);
    const offset = index - gallery.display;
    const dist = Math.abs(offset);
    const expanding = gallery.expand.index === index;
    const e = expanding ? gallery.expand.progress : 0;
    const others = gallery.expand.index >= 0 && !expanding ? gallery.expand.progress : 0;
    const intro = gallery.intro;

    const fullH = 2 * (layout.camZ + layout.R) * Math.tan((layout.fov * Math.PI) / 360);
    const vel = Math.max(-1, Math.min(1, gallery.velocity * 0.22));

    zoom.current = damp(zoom.current, gallery.hover === index && !gallery.dragging ? 1.075 : 1, 6, dt);

    u.uOffset.value = offset;
    u.uR.value = layout.R;
    u.uW.value = layout.W;
    u.uH.value = layout.H;
    u.uStep.value = layout.step;
    u.uBend.value = Math.abs(vel) * 0.55 * (1 - e);
    u.uLift.value = (1 - intro) * -layout.H * 0.18 * (1 + dist * 0.4);
    u.uExpand.value = e;
    u.uFull.value = [fullH * layout.aspect, fullH];
    u.uAspect.value = layout.W / layout.H + (layout.aspect - layout.W / layout.H) * e;
    u.uZoom.value = zoom.current + (1 - zoom.current) * e;
    u.uVel.value = vel * (1 - e);
    u.uRadius.value = layout.radius * (1 - e);
    u.uDim.value = smoothstep(0.15, 1.4, dist) * 0.42;
    u.uGrade.value = 1 - e;
    u.uTime.value = state.clock.elapsedTime;
    const opacity = (1 - smoothstep(1.55, 2.35, dist)) * (1 - others) * smoothstep(0, 0.6, intro);
    u.uOpacity.value = Math.max(opacity, e > 0 ? 1 : 0);
    m.visible = u.uOpacity.value > 0.002;
    m.renderOrder = expanding ? 100 : -Math.round(dist * 10);
  });

  return (
    <mesh ref={mesh} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={panelVertex}
        fragmentShader={panelFragment}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export type GallerySceneProps = { items: GalleryItem[]; onReady?: () => void };

export function GalleryScene({ items, onReady }: GallerySceneProps) {
  const size = useThree((s) => s.size);
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const layout = useMemo(() => computeLayout(size.width / Math.max(1, size.height)), [size.width, size.height]);
  const textures = useTexture(
    items.map((i) => i.cover.src),
    (loaded) => {
      for (const tex of Array.isArray(loaded) ? loaded : [loaded]) {
        tex.colorSpace = SRGBColorSpace;
        tex.anisotropy = Math.min(8, maxAnisotropy);
      }
    },
  );
  const geometry = useMemo(() => new PlaneGeometry(1, 1, 64, 12), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <>
      <PerspectiveCamera makeDefault fov={layout.fov} position={[0, 0, layout.camZ]} near={0.1} far={40} />
      {items.map((item, i) => (
        <Panel key={item.slug} index={i} item={item} texture={textures[i]} layout={layout} geometry={geometry} />
      ))}
    </>
  );
}
