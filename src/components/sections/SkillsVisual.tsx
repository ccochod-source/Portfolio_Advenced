"use client";

import type { ReactNode } from "react";
import { SkillsConstellationLazy } from "@/components/three/constellation/SkillsConstellationLazy";
import type { ConstellationLabels, ConstellationSkill } from "@/components/three/constellation/types";

type SkillsVisualProps = {
  skills: ConstellationSkill[];
  labels: ConstellationLabels;
  projectBasePath: string;
  /** Summary text of the disclosure that holds the full DOM list under the constellation. */
  listLabel: string;
  /** Semantic DOM list, kept behind a disclosure so screen readers hear one version at a time. */
  children: ReactNode;
};

/**
 * 3D constellation on every viewport (its own keyboard chips + detail card; compact chips when WebGL is missing or
 * motion is reduced on a phone) with the full DOM list in a closed `<details>` below.
 */
export function SkillsVisual({ skills, labels, projectBasePath, listLabel, children }: SkillsVisualProps) {
  return (
    <div className="relative mt-14 md:mt-20">
      <SkillsConstellationLazy skills={skills} labels={labels} projectBasePath={projectBasePath} className="mb-10" />
      <details className="group/list border-t border-cream-muted/15 pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 font-mono text-label uppercase text-cream-dim marker:hidden [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="transition-transform duration-300 group-open/list:rotate-90">→</span>
          {listLabel}
        </summary>
        <div className="pt-10">{children}</div>
      </details>
    </div>
  );
}
