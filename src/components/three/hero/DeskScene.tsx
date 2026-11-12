"use client";

import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { AdditiveBlending, Color } from "three";
import { Avatar } from "../avatar/Avatar";
import { PALETTE } from "./constants";
import {
  DESK_TOP_HEIGHT,
  DESK_YAW,
  LAPTOP_HINGE_LOCAL,
  LAPTOP_LID_TILT,
  SCREEN_SIZE,
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

const ALU = { color: "#d8d3cb", metalness: 0.65, roughness: 0.32 } as const;

/** MacBook open on the lap: base on the thighs, hinge at the knees, lid leaning 20° back. The screen quad is named `laptop-screen`. */
function Laptop() {
  const lidH = SCREEN_SIZE.height + 0.02;
  const lidW = SCREEN_SIZE.width + 0.012;
  return (
    <group>
      <RoundedBox args={[lidW, 0.012, 0.21]} radius={0.004} smoothness={3} position={[0, DESK_TOP_HEIGHT - 0.006, 0.315]}>
        <meshStandardMaterial {...ALU} />
      </RoundedBox>
      <mesh position={[0, DESK_TOP_HEIGHT + 0.0015, 0.355]}>
        <boxGeometry args={[0.255, 0.003, 0.095]} />
        <meshStandardMaterial color={PALETTE.ink} roughness={0.55} metalness={0.1} />
      </mesh>
      <mesh position={[0, DESK_TOP_HEIGHT + 0.001, 0.255]}>
        <boxGeometry args={[0.11, 0.002, 0.065]} />
        <meshStandardMaterial color="#c9c3ba" roughness={0.4} metalness={0.5} />
      </mesh>
      <group position={[...LAPTOP_HINGE_LOCAL]} rotation={[LAPTOP_LID_TILT, 0, 0]}>
        <RoundedBox args={[lidW, lidH, 0.006]} radius={0.004} smoothness={3} position={[0, lidH / 2, 0]}>
          <meshStandardMaterial {...ALU} />
        </RoundedBox>
        <mesh position={[0, lidH / 2, -0.0032]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[SCREEN_SIZE.width + 0.004, SCREEN_SIZE.height + 0.004]} />
          <meshStandardMaterial color="#1a100c" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh name="laptop-screen" position={[0, lidH / 2, -0.0036]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[SCREEN_SIZE.width, SCREEN_SIZE.height]} />
          <meshStandardMaterial color={PALETTE.cream} emissive={PALETTE.creamDeep} emissiveIntensity={1.4} roughness={0.4} metalness={0} />
        </mesh>
        <mesh position={[0, lidH * 0.55, 0.0036]}>
          <planeGeometry args={[0.04, 0.04]} />
          <meshBasicMaterial color={PALETTE.gold} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
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
      <Laptop />
    </group>
  );
}
