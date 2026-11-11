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
  /** Summary text of the disclosure that holds the full DOM list under the constellation. */
  listLabel: string;
  /** Semantic DOM list: shown on mobile / before hydration, behind a disclosure on desktop. */
  children: ReactNode;
};

/**
 * Desktop: 3D constellation (its own keyboard chips + detail panel) with the full DOM list in a closed
 * `<details>` so screen readers hear one version at a time. Mobile: the DOM list only.
 */
export function SkillsVisual({ skills, labels, projectBasePath, listLabel, children }: SkillsVisualProps) {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const mobile = useIsMobile();
  const constellation = mounted && !mobile;

  if (!constellation) return <div className="relative mt-14 md:mt-20">{children}</div>;

  return (
    <div className="relative mt-14 md:mt-20">
      <SkillsConstellationLazy skills={skills} labels={labels} projectBasePath={projectBasePath} className="mb-10" />
      <details className="group/list border-t border-ink/10 pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 font-mono text-label uppercase text-ink-soft marker:hidden [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="transition-transform duration-300 group-open/list:rotate-90">→</span>
          {listLabel}
        </summary>
        <div className="pt-10">{children}</div>
      </details>
    </div>
  );
}
