"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { LayoutEdge, LayoutNode } from "./layout";

const EDGE_IDLE = new THREE.Color("#e9c7a6");
const EDGE_ACTIVE = new THREE.Color("#ff7a1a");
const tmpColor = new THREE.Color();
const tmpVec = new THREE.Vector3();

let glowTexture: THREE.CanvasTexture | null = null;
function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.45)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  glowTexture = new THREE.CanvasTexture(canvas);
  return glowTexture;
}

export type SceneProps = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  activeIndex: number | null;
  linked: Set<number>;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  autoRotate: boolean;
  animate: boolean;
  /** Narrow viewport: vertical layout, lighter geometry, fewer labels. */
  mobile: boolean;
  /** Coarse pointer: drag-to-rotate that leaves vertical page scrolling to the browser. */
  touch: boolean;
  labelRefs: RefObject<(HTMLElement | null)[]>;
  onInteractStart: () => void;
  onInteractEnd: () => void;
};

type NodeProps = {
  node: LayoutNode;
  state: "active" | "linked" | "dimmed" | "idle";
  segments: number;
  animate: boolean;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
};

function SkillNode({ node, state, segments, animate, onHover, onSelect }: NodeProps) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef<THREE.Sprite>(null);
  const texture = useMemo(() => getGlowTexture(), []);
  const color = useMemo(() => new THREE.Color(node.color), [node.color]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const k = animate ? 1 - Math.exp(-delta * 10) : 1;
    const targetScale = state === "active" ? 1.45 : state === "linked" ? 1.15 : state === "dimmed" ? 0.85 : 1;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, targetScale, k));

    if (material.current) {
      const emissive = state === "active" ? 0.9 : state === "linked" ? 0.65 : 0.3;
      material.current.emissiveIntensity = THREE.MathUtils.lerp(material.current.emissiveIntensity, emissive, k);
    }
    if (glow.current) {
      const mat = glow.current.material as THREE.SpriteMaterial;
      const opacity = state === "active" ? 0.95 : state === "linked" ? 0.6 : state === "dimmed" ? 0.18 : 0.4;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, opacity, k);
    }
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(node.index);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    onHover(null);
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(node.index);
  };

  return (
    <group ref={group} position={node.position}>
      <mesh onPointerOver={over} onPointerOut={out} onClick={click}>
        <sphereGeometry args={[node.radius, segments, segments]} />
        <meshStandardMaterial ref={material} color={color} emissive={color} emissiveIntensity={0.3} roughness={0.35} metalness={0.1} />
      </mesh>
      <sprite ref={glow} scale={node.radius * 6}>
        <spriteMaterial map={texture} color={color} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

function Edges({ nodes, edges, activeIndex, animate }: { nodes: LayoutNode[]; edges: LayoutEdge[]; activeIndex: number | null; animate: boolean }) {
  const colors = useRef<THREE.BufferAttribute>(null);
  const strength = useRef<Float32Array>(new Float32Array(edges.length));

  const positions = useMemo(() => {
    const arr = new Float32Array(edges.length * 6);
    edges.forEach((e, i) => {
      arr.set(nodes[e.a].position, i * 6);
      arr.set(nodes[e.b].position, i * 6 + 3);
    });
    return arr;
  }, [nodes, edges]);

  const colorArray = useMemo(() => {
    const arr = new Float32Array(edges.length * 6);
    for (let i = 0; i < edges.length * 2; i++) EDGE_IDLE.toArray(arr, i * 3);
    return arr;
  }, [edges.length]);

  useFrame((_, delta) => {
    const attr = colors.current;
    if (!attr) return;
    const k = animate ? 1 - Math.exp(-delta * 8) : 1;
    const s = strength.current;
    let dirty = false;
    edges.forEach((e, i) => {
      const target = activeIndex !== null && (e.a === activeIndex || e.b === activeIndex) ? 1 : 0;
      const next = THREE.MathUtils.lerp(s[i], target, k);
      if (Math.abs(next - s[i]) < 0.001 && Math.abs(target - next) < 0.001) return;
      s[i] = next;
      tmpColor.copy(EDGE_IDLE).lerp(EDGE_ACTIVE, next);
      tmpColor.toArray(attr.array as Float32Array, i * 6);
      tmpColor.toArray(attr.array as Float32Array, i * 6 + 3);
      dirty = true;
    });
    if (dirty) attr.needsUpdate = true;
  });

  if (!edges.length) return null;
  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute ref={colors} attach="attributes-color" args={[colorArray, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.9} depthWrite={false} />
    </lineSegments>
  );
}

type LabelProjectorProps = {
  nodes: LayoutNode[];
  world: RefObject<THREE.Group | null>;
  labelRefs: RefObject<(HTMLElement | null)[]>;
  activeIndex: number | null;
  linked: Set<number>;
  mobile: boolean;
};

type Queued = { el: HTMLElement; rank: number; x: number; y: number; scale: number; keep: boolean };
/** Per-frame scratch lists of the mobile label layout (one constellation on the page). */
const labelQueue: Queued[] = [];
const labelBoxes: Box[] = [];
type Box = { x0: number; y0: number; x1: number; y1: number };
const LABEL_GAP = 3;
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 + LABEL_GAP && a.x1 + LABEL_GAP > b.x0 && a.y0 < b.y1 + LABEL_GAP && a.y1 + LABEL_GAP > b.y0;

function LabelProjector({ nodes, world, labelRefs, activeIndex, linked, mobile }: LabelProjectorProps) {
  useFrame(({ camera, size }) => {
    const parent = world.current;
    const els = labelRefs.current;
    if (!parent || !els) return;
    const camDist = camera.position.length();
    const queue = labelQueue;
    queue.length = 0;
    nodes.forEach((node, i) => {
      const el = els[i];
      if (!el) return;
      tmpVec.set(node.position[0], node.position[1] - node.radius - 0.08, node.position[2]);
      parent.localToWorld(tmpVec);
      const dist = camera.position.distanceTo(tmpVec);
      tmpVec.project(camera);
      const x = (tmpVec.x * 0.5 + 0.5) * size.width;
      const y = (-tmpVec.y * 0.5 + 0.5) * size.height;
      const scale = THREE.MathUtils.clamp(camDist / dist, 0.7, 1.15);
      const depthFade = THREE.MathUtils.clamp(1 - (dist - camDist) / 3.2, 0.3, 1);
      const state = activeIndex === null ? "idle" : activeIndex === node.index ? "active" : linked.has(node.index) ? "linked" : "dimmed";
      const hiddenOnMobile = mobile && state !== "active" && state !== "linked" && (node.skill.weight ?? 3) < 4;
      const opacity = hiddenOnMobile ? 0 : state === "active" ? 1 : state === "dimmed" ? depthFade * 0.35 : depthFade;
      el.style.transform = `translate(-50%, 0) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      el.style.opacity = opacity.toFixed(3);
      el.style.zIndex = String(Math.round((camDist * 2 - dist) * 10) + (state === "active" ? 1000 : 0));
      if (mobile && opacity > 0) {
        // Nearest first within a state; the pinned skill, then its links, keep their place before the others.
        const keep = state === "active" || state === "linked";
        queue.push({ el, rank: (state === "active" ? 0 : state === "linked" ? 100 : 200) + dist, x, y, scale, keep });
      }
    });
    if (!mobile) return;

    // Narrow screens: labels of a dense cluster would print over each other. In priority order, a label that collides
    // slides under the ones already placed; if there is no room nearby it is dropped,
    // except the pinned skill and its links, which always stay readable.
    const boxes = labelBoxes;
    boxes.length = 0;
    queue.sort((a, b) => a.rank - b.rank);
    for (const { el, x, y, scale, keep } of queue) {
      const w = el.offsetWidth * scale;
      const h = el.offsetHeight * scale;
      // The label scales around its centre: `inset` is how far its drawn top sits below the translated top.
      const inset = (el.offsetHeight - h) / 2;
      const box: Box = { x0: x - w / 2, x1: x + w / 2, y0: y + inset, y1: y + inset + h };
      const limit = box.y0 + h * (keep ? 6 : 1.6);
      let free = false;
      for (let pass = 0; pass < 12 && !free; pass++) {
        const hit = boxes.find((other) => overlaps(box, other));
        if (!hit) free = true;
        else {
          box.y0 = hit.y1 + LABEL_GAP + 0.5;
          box.y1 = box.y0 + h;
          if (box.y0 > limit) break;
        }
      }
      if (!free && !keep) {
        el.style.opacity = "0";
        continue;
      }
      boxes.push(box);
      if (box.y0 !== y + inset) el.style.transform = `translate(-50%, 0) translate(${x.toFixed(1)}px, ${(box.y0 - inset).toFixed(1)}px) scale(${scale.toFixed(3)})`;
    }
  });
  return null;
}

function CameraRig({ mobile }: { mobile: boolean }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const distance = mobile ? 11.6 : aspect < 1.2 ? 11 : 9.2;
    camera.position.setLength(distance);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, mobile]);
  return null;
}

/** Re-renders a `frameloop="demand"` canvas when the highlighted skill changes (reduced motion). */
function InvalidateOn({ value }: { value: unknown }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [value, invalidate]);
  return null;
}

type TouchRotateProps = {
  onRotate: (dx: number, dy: number) => void;
  onInteractStart: () => void;
  onInteractEnd: () => void;
};

const TOUCH_PITCH_LIMIT = 0.45;

/**
 * Finger drag rotates the constellation. The canvas keeps `touch-action: pan-y`, so a vertical swipe scrolls the
 * page (the browser then cancels the pointer) and only horizontal / diagonal drags rotate; taps still select.
 */
function TouchRotate({ onRotate, onInteractStart, onInteractEnd }: TouchRotateProps) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const gesture = useRef<{ id: number; x: number; y: number; mode: "pending" | "rotate" | "scroll" } | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (!e.isPrimary || gesture.current) return;
      gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, mode: "pending" };
    };
    const move = (e: PointerEvent) => {
      const g = gesture.current;
      if (!g || e.pointerId !== g.id) return;
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      if (g.mode === "pending") {
        if (Math.hypot(dx, dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx) * 1.4) {
          g.mode = "scroll";
          return;
        }
        g.mode = "rotate";
        onInteractStart();
      }
      if (g.mode !== "rotate") return;
      g.x = e.clientX;
      g.y = e.clientY;
      onRotate(dx, dy);
      invalidate();
    };
    const up = (e: PointerEvent) => {
      const g = gesture.current;
      if (!g || e.pointerId !== g.id) return;
      if (g.mode === "rotate") onInteractEnd();
      gesture.current = null;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl, invalidate, onRotate, onInteractStart, onInteractEnd]);
  return null;
}

export function ConstellationScene({
  nodes,
  edges,
  activeIndex,
  linked,
  onHover,
  onSelect,
  autoRotate,
  animate,
  mobile,
  touch,
  labelRefs,
  onInteractStart,
  onInteractEnd,
}: SceneProps) {
  const world = useRef<THREE.Group>(null);
  const touchTarget = useRef({ yaw: 0, pitch: 0 });
  const segments = mobile ? 16 : 28;

  useFrame(({ clock }, delta) => {
    const g = world.current;
    if (!g) return;
    if (animate) {
      const t = clock.getElapsedTime();
      g.position.y = Math.sin(t * 0.5) * 0.12;
      g.rotation.z = Math.sin(t * 0.3) * 0.03;
    }
    if (touch) {
      const target = touchTarget.current;
      if (autoRotate) target.yaw += delta * 0.12;
      const k = animate ? 1 - Math.exp(-delta * 6) : 1;
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, target.yaw, k);
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, target.pitch, k);
    }
  });

  const onTouchRotate = (dx: number, dy: number) => {
    const target = touchTarget.current;
    target.yaw += dx * 0.008;
    target.pitch = THREE.MathUtils.clamp(target.pitch + dy * 0.005, -TOUCH_PITCH_LIMIT, TOUCH_PITCH_LIMIT);
  };

  return (
    <>
      <CameraRig mobile={mobile} />
      <ambientLight intensity={1.1} color="#fff1dc" />
      <directionalLight position={[4, 6, 5]} intensity={1.6} color="#ffe7c2" />
      <directionalLight position={[-5, -2, -4]} intensity={0.5} color="#ffb36b" />
      <LabelProjector nodes={nodes} world={world} labelRefs={labelRefs} activeIndex={activeIndex} linked={linked} mobile={mobile} />
      <InvalidateOn value={activeIndex} />
      <group ref={world}>
        <Edges nodes={nodes} edges={edges} activeIndex={activeIndex} animate={animate} />
        {nodes.map((node) => {
          const state =
            activeIndex === null ? "idle" : activeIndex === node.index ? "active" : linked.has(node.index) ? "linked" : "dimmed";
          return (
            <SkillNode key={node.skill.id} node={node} state={state} segments={segments} animate={animate} onHover={onHover} onSelect={onSelect} />
          );
        })}
      </group>
      {touch ? (
        <TouchRotate onRotate={onTouchRotate} onInteractStart={onInteractStart} onInteractEnd={onInteractEnd} />
      ) : (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.55}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.7}
          onStart={onInteractStart}
          onEnd={onInteractEnd}
        />
      )}
    </>
  );
}
