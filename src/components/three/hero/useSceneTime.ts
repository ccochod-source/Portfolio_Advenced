"use client";

import { useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";

/** Accumulated scene time with clamped deltas, so pauses (tab hidden / offscreen) do not cause jumps. */
export function useSceneTime(onTick: (state: RootState, time: number, delta: number) => void, enabled = true) {
  const time = useRef(0);
  useFrame((state, delta) => {
    if (!enabled) return;
    const d = Math.min(delta, 0.05);
    time.current += d;
    onTick(state, time.current, d);
  });
}
