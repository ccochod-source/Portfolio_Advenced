"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { SkillsConstellationFallback } from "./SkillsConstellationFallback";
import type { SkillsConstellationProps } from "./types";

const SkillsConstellation = dynamic(() => import("./SkillsConstellation").then((m) => m.SkillsConstellation), {
  ssr: false,
  loading: () => <div className="h-[115vw] min-h-[24rem] max-h-[42rem] md:h-[60vw] lg:h-[36rem] xl:h-[40rem]" aria-hidden />,
});

export function SkillsConstellationLazy(props: SkillsConstellationProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) {
    return <SkillsConstellationFallback
        skills={props.skills}
        labels={props.labels}
        projectHref={props.projectHref}
        projectBasePath={props.projectBasePath}
        className={props.className}
      />;
  }
  return <SkillsConstellation {...props} />;
}
