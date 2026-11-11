"use client";

import { useEffect, useState } from "react";

/**
 * `true` once the page has finished loading and the main thread is idle, so 3D chunks
 * (and the avatar GLB they preload) never compete with the first paint / LCP.
 */
export function useAfterLoad(timeout = 1500): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let idle = 0;
    let timer = 0;
    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(() => setReady(true), { timeout });
      else timer = window.setTimeout(() => setReady(true), 200);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idle) window.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
    };
  }, [timeout]);
  return ready;
}
