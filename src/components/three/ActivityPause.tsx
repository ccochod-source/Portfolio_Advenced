"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import "@/lib/three/console";

type Frameloop = "always" | "demand" | "never";

/**
 * Next 16 keeps the previous route mounted but hidden (`<Activity>`) after a client navigation; hidden
 * subtrees have their effects cleaned up, so this stops the render loop while the route is hidden and
 * restores the requested mode when it is shown again. Render it inside a `<Canvas>`.
 */
export function ActivityPause({ frameloop }: { frameloop: Frameloop }) {
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    setFrameloop(frameloop);
    return () => setFrameloop("never");
  }, [frameloop, setFrameloop]);
  return null;
}
