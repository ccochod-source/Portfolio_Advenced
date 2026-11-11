"use client";

import { useSyncExternalStore } from "react";
import { TextReveal } from "@/components/motion";
import { useIsMobile } from "@/components/three/hero/useHeroMotion";

const subscribeNoop = () => () => {};

/**
 * Hero H1 = the LCP element. On mobile (and before hydration) it stays a plain server-rendered
 * heading so the LCP is not re-candidated by the SplitText pass; desktop gets the word reveal.
 */
export function HeroTitle({ title, className }: { title: string; className: string }) {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const mobile = useIsMobile();
  if (!mounted || mobile) return <h1 className={className}>{title}</h1>;
  return (
    <TextReveal as="h1" type="words" pending={false} delay={0.15} className={className}>
      {title}
    </TextReveal>
  );
}
