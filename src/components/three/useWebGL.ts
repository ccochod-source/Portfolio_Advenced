"use client";

import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};
let cached: boolean | null = null;

/** True when the browser can create a WebGL context (probed once, the probe context is released). */
export function useWebGL() {
  return useSyncExternalStore(
    subscribeNoop,
    () => {
      if (cached !== null) return cached;
      try {
        const c = document.createElement("canvas");
        const gl = c.getContext("webgl2") || c.getContext("webgl");
        cached = !!gl;
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        cached = false;
      }
      return cached;
    },
    () => false,
  );
}
