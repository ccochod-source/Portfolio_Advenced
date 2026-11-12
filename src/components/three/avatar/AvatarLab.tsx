"use client";

import { useState } from "react";
import { AVATAR_CLIPS, type AvatarClip } from "./clips";
import { AvatarStageLazy } from "./AvatarStageLazy";
import { useReducedMotion } from "./Avatar";

export type AvatarLabLabels = {
  clips: Record<AvatarClip, string>;
  clipGroup: string;
  current: string;
  reducedMotion: string;
  figure: string;
};

export function AvatarLab({ labels, initialClip = "Idle" }: { labels: AvatarLabLabels; initialClip?: AvatarClip }) {
  const [clip, setClip] = useState<AvatarClip>(initialClip);
  const reducedMotion = useReducedMotion();

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
      <div>
        <p className="font-mono text-label uppercase text-ink-soft">
          {labels.current} <span className="text-sun">{labels.clips[clip]}</span>
        </p>
        <div role="group" aria-label={labels.clipGroup} className="mt-5 flex flex-wrap gap-3">
          {AVATAR_CLIPS.map((name) => {
            const active = name === clip;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={active}
                onClick={() => setClip(name)}
                className={`rounded-full px-5 py-3 text-sm font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun ${
                  active ? "bg-ink text-cream" : "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-cream"
                }`}
              >
                {labels.clips[name]}
              </button>
            );
          })}
        </div>
        {reducedMotion && <p className="mt-6 max-w-md text-sm text-ink-soft">{labels.reducedMotion}</p>}
      </div>

      <figure className="relative mx-auto aspect-[3/4] w-full max-w-[520px] overflow-hidden rounded-[2rem] bg-[radial-gradient(ellipse_at_50%_70%,var(--color-cream-deep),var(--color-cream)_70%)]">
        <AvatarStageLazy clip={clip} rotation={[0, 0.35, 0]} cameraZ={4.7} className="h-full w-full" />
        <figcaption className="sr-only">
          {labels.figure} {labels.clips[clip]}
        </figcaption>
      </figure>
    </div>
  );
}
