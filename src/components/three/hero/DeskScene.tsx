"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, useGLTF } from "@react-three/drei";
import { AdditiveBlending, Color, type InstancedMesh, Matrix4, Vector3 } from "three";
import { AVATAR_MODEL_URL, Avatar } from "../avatar/Avatar";
import { HAND_LIFT, dampTypingClip, findArms, offsetHand } from "./typingPose";
import { PALETTE } from "./constants";
import {
  DESK_TOP_HEIGHT,
  DESK_YAW,
  LAPTOP_HINGE_LOCAL,
  LAPTOP_LID_HALF_HEIGHT,
  LAPTOP_LID_THICKNESS,
  LAPTOP_LID_TILT,
  SCREEN_SIZE,
  ZOOM_FACE_MESH_NAME,
  deskOriginFor,
  deskScaleFor,
} from "./desk";

/** Fluffy cloud seat: a cluster of soft spheres, seat top ≈ 0.5 m under the avatar's hips, lower puffs under the dangling feet. */
const CLOUD_BLOBS: [number, number, number, number][] = [
  [0, 0.08, 0.05, 0.44],
  [0.3, 0.1, 0.12, 0.34],
  [-0.3, 0.1, 0.1, 0.34],
  [0.05, -0.2, 0.5, 0.34],
  [-0.4, -0.05, 0.4, 0.3],
  [0.48, -0.02, 0.35, 0.28],
  [0, -0.02, -0.4, 0.36],
  [0.36, -0.08, -0.3, 0.3],
  [-0.38, -0.08, -0.28, 0.3],
  [0, -0.32, 0, 0.48],
  [0.55, -0.3, 0.05, 0.3],
  [-0.58, -0.28, 0.1, 0.3],
  [0.2, -0.45, 0.35, 0.26],
  [-0.25, -0.5, -0.2, 0.26],
  [0.62, -0.18, -0.15, 0.2],
  [-0.66, -0.12, 0.3, 0.18],
];

const GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const GLOW_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, d);
    a *= a;
    gl_FragColor = vec4(uColor, a * uIntensity);
  }
`;

function Cloud() {
  const glowUniforms = useMemo(() => ({ uColor: { value: new Color(PALETTE.gold) }, uIntensity: { value: 0.55 } }), []);
  return (
    <group>
      {CLOUD_BLOBS.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[r, r * 0.82, r]}>
          <sphereGeometry args={[1, 28, 20]} />
          <meshStandardMaterial color={PALETTE.cream} roughness={1} metalness={0} emissive={PALETTE.creamDeep} emissiveIntensity={0.18} />
        </mesh>
      ))}
      <mesh position={[0, -0.1, -0.6]} scale={[3.2, 2.2, 1]} renderOrder={-1}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial vertexShader={GLOW_VERTEX} fragmentShader={GLOW_FRAGMENT} uniforms={glowUniforms} transparent depthWrite={false} blending={AdditiveBlending} />
      </mesh>
    </group>
  );
}

const ALU = { color: "#cfc9c1", metalness: 0.7, roughness: 0.38 } as const;
const Y_AXIS = new Vector3(0, 1, 0);
const KEY_ROWS = 6;
const KEY_COLS = 14;
const KEY_PITCH = 0.0185;

/** Key caps of the keyboard well: one instanced grid, slightly inset dark keys. */
function Keys() {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new Matrix4();
    let i = 0;
    for (let r = 0; r < KEY_ROWS; r++) {
      for (let c = 0; c < KEY_COLS; c++) {
        const wide = r === KEY_ROWS - 1 && c >= 5 && c <= 8;
        if (wide && c !== 5) continue;
        m.makeScale(wide ? 4.2 : 1, 1, 1);
        m.setPosition((c - (KEY_COLS - 1) / 2) * KEY_PITCH + (wide ? 1.5 * KEY_PITCH : 0), 0, (r - (KEY_ROWS - 1) / 2) * KEY_PITCH);
        mesh.setMatrixAt(i++, m);
      }
    }
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, KEY_ROWS * KEY_COLS]}>
      <boxGeometry args={[0.0155, 0.0012, 0.0155]} />
      <meshStandardMaterial color="#26201c" roughness={0.6} metalness={0.05} />
    </instancedMesh>
  );
}

/**
 * MacBook (13": 30.4 × 21.2 cm base, 1.6 cm closed) open on the lap, hinge at the knees, lid leaning 20° back.
 * Procedural: thin unibody base with rounded corners, dark keyboard well with key grid, trackpad, hinge barrel,
 * lid with black bezel and the `laptop-screen` quad facing the avatar; the lid back carries the `laptop-lid-back`
 * quad ScreenContent paints the next page on. No logo (trademark).
 */
function Laptop() {
  const baseW = 0.304;
  const baseD = 0.212;
  const baseT = 0.01;
  const lidH = LAPTOP_LID_HALF_HEIGHT * 2;
  const lidW = 0.304;
  const hingeZ = LAPTOP_HINGE_LOCAL[2];
  const baseCenterZ = hingeZ - baseD / 2 + 0.004;
  const top = DESK_TOP_HEIGHT;
  return (
    <group>
      <RoundedBox args={[baseW, baseT, baseD]} radius={0.0045} smoothness={4} position={[0, top - baseT / 2, baseCenterZ]}>
        <meshStandardMaterial {...ALU} />
      </RoundedBox>
      {/* keyboard well */}
      <mesh position={[0, top + 0.0002, hingeZ - 0.07]}>
        <boxGeometry args={[0.272, 0.0012, 0.115]} />
        <meshStandardMaterial color="#1c1613" roughness={0.7} metalness={0.05} />
      </mesh>
      <group position={[0, top + 0.0015, hingeZ - 0.07]}>
        <Keys />
      </group>
      {/* trackpad */}
      <mesh position={[0, top + 0.0003, hingeZ - 0.165]}>
        <boxGeometry args={[0.13, 0.0006, 0.078]} />
        <meshStandardMaterial color="#aaa49d" roughness={0.25} metalness={0.8} />
      </mesh>
      {/* hinge barrel */}
      <mesh position={[0, top + 0.004, hingeZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.006, 0.006, baseW - 0.06, 24]} />
        <meshStandardMaterial color="#6f6a64" roughness={0.45} metalness={0.85} />
      </mesh>
      <group position={[...LAPTOP_HINGE_LOCAL]} rotation={[LAPTOP_LID_TILT, 0, 0]}>
        <RoundedBox args={[lidW, lidH, LAPTOP_LID_THICKNESS]} radius={0.0045} smoothness={4} position={[0, lidH / 2, 0]}>
          <meshStandardMaterial {...ALU} />
        </RoundedBox>
        <mesh position={[0, lidH / 2, -0.0032]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[lidW - 0.006, lidH - 0.006]} />
          <meshStandardMaterial color="#0f0b09" roughness={0.25} metalness={0.3} />
        </mesh>
        <mesh name="laptop-screen" position={[0, lidH / 2, -0.0036]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[SCREEN_SIZE.width, SCREEN_SIZE.height]} />
          <meshStandardMaterial color={PALETTE.cream} emissive={PALETTE.creamDeep} emissiveIntensity={1.4} roughness={0.4} metalness={0} />
        </mesh>
        <mesh name={ZOOM_FACE_MESH_NAME} position={[0, lidH / 2, LAPTOP_LID_THICKNESS / 2 + 0.0004]}>
          <planeGeometry args={[SCREEN_SIZE.width, SCREEN_SIZE.height]} />
          <meshBasicMaterial color={ALU.color} transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Post-animation pass on the hero avatar: calm shoulders (clip damping) and hands lifted over the keyboard (IK). */
function TypingPose({ scale }: { scale: number }) {
  const scene = useThree((s) => s.scene);
  const { animations } = useGLTF(AVATAR_MODEL_URL, false, true);
  useLayoutEffect(() => {
    const typing = animations.find((c) => c.name === "Typing");
    if (typing) dampTypingClip(typing);
  }, [animations]);
  const arms = useRef<ReturnType<typeof findArms>>([]);
  const lift = useMemo(() => new Vector3(), []);
  useFrame(() => {
    if (arms.current.length === 0 || !arms.current[0].upper.parent) {
      arms.current = findArms(scene);
      if (arms.current.length === 0) return;
    }
    // HAND_LIFT is expressed in the set frame: the set is yawed and scaled (desk.ts).
    lift.copy(HAND_LIFT).applyAxisAngle(Y_AXIS, DESK_YAW).multiplyScalar(scale);
    for (const arm of arms.current) offsetHand(arm, lift);
  });
  return null;
}

/**
 * The hero set: Clément's avatar sitting on a cloud, MacBook open on his lap, typing (clip `Typing`).
 * Placed by the desk.ts contract so the zoom transition can find the screen.
 */
export function DeskScene() {
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const origin = deskOriginFor(aspect);
  const scale = deskScaleFor(aspect);

  return (
    <group position={[...origin]} rotation={[0, DESK_YAW, 0]} scale={scale}>
      <directionalLight position={[2.5, 3.5, 3]} intensity={1.9} color={PALETTE.gold} />
      <directionalLight position={[-3, 1.2, -2.5]} intensity={1.1} color={PALETTE.sun} />
      <hemisphereLight intensity={0.45} color={PALETTE.cream} groundColor={PALETTE.inkSoft} />
      <Cloud />
      <Avatar clip="Typing" />
      <TypingPose scale={scale} />
      <Laptop />
    </group>
  );
}
