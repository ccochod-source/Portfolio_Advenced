"use client";

import { useEffect, useState } from "react";

function useMediaQuery(query: string, fallback = false) {
  const [matches, setMatches] = useState(fallback);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Coarse pointer (touch) or narrow viewport → lighter scene, no parallax. */
export function useIsMobile() {
  const coarse = useMediaQuery("(pointer: coarse)");
  const narrow = useMediaQuery("(max-width: 767px)");
  return coarse || narrow;
}

export function useCanHover() {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}
