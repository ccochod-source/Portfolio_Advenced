"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { SkillsConstellationLazy } from "@/components/three/constellation/SkillsConstellationLazy";
import type { ConstellationLabels, ConstellationSkill } from "@/components/three/constellation/types";
import { useIsMobile } from "@/components/three/hero/useHeroMotion";

const subscribeNoop = () => () => {};

type SkillsVisualProps = {
  skills: ConstellationSkill[];
  labels: ConstellationLabels;
  projectBasePath: string;
  /** Semantic DOM list: shown on mobile / before hydration, kept for assistive tech on desktop. */
  children: ReactNode;
};

/** Desktop: 3D constellation above the (visually hidden) DOM list; mobile: the DOM list only. */
export function SkillsVisual({ skills, labels, projectBasePath, children }: SkillsVisualProps) {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const mobile = useIsMobile();
  const constellation = mounted && !mobile;

  return (
    <div className="relative mt-14 md:mt-20">
      {constellation && (
        <SkillsConstellationLazy skills={skills} labels={labels} projectBasePath={projectBasePath} className="mb-16" />
      )}
      <div className={constellation ? "sr-only" : undefined}>{children}</div>
    </div>
  );
}
