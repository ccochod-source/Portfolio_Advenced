"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { SkillsConstellationFallback } from "./SkillsConstellationFallback";
import type { SkillsConstellationProps } from "./types";

const SkillsConstellation = dynamic(() => import("./SkillsConstellation").then((m) => m.SkillsConstellation), {
  ssr: false,
  loading: () => <div className="h-[115vw] min-h-[24rem] max-h-[42rem] md:h-[60vw] lg:h-[36rem] xl:h-[40rem]" aria-hidden />,
});

/** Renders the DOM fallback on the server and keeps it until the section comes within a viewport of the fold, then swaps in the 3D chunk. */
export function SkillsConstellationLazy(props: SkillsConstellationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  if (!near) {
    return (
      <div ref={ref}>
        <SkillsConstellationFallback
          skills={props.skills}
          labels={props.labels}
          projectHref={props.projectHref}
          projectBasePath={props.projectBasePath}
          className={props.className}
        />
      </div>
    );
  }
  return <SkillsConstellation {...props} />;
}
