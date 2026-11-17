"use client";

import { useState, type ReactNode } from "react";
import { Magnetic } from "../Magnetic";
import { Preloader } from "../Preloader";
import { Reveal } from "../Reveal";

type PreloaderDemoProps = {
  label: string;
  skipHint: string;
  replayLabel: string;
  doneLabel: string;
  /** Rendered under the replay button, inside the same Reveal. */
  children?: ReactNode;
};

export function PreloaderDemo({ label, skipHint, replayLabel, doneLabel, children }: PreloaderDemoProps) {
  const [run, setRun] = useState(0);
  const [completed, setCompleted] = useState(0);

  return (
    <>
      <Preloader
        key={run}
        force={run > 0}
        label={label}
        skipHint={skipHint}
        onComplete={() => setCompleted((count) => count + 1)}
      />
      {/* The curtain stays outside the Reveal: a hidden or transformed ancestor would hide it. */}
      <Reveal delay={0.5} className="mt-10 space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <Magnetic>
            <button
              type="button"
              onClick={() => setRun((count) => count + 1)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-silk px-5 py-3 text-sm font-medium text-cream transition-colors duration-300 hover:bg-ember"
            >
              {replayLabel}
            </button>
          </Magnetic>
          <p className="font-mono text-label uppercase text-cream-dim" aria-live="polite">
            onComplete × {completed} {completed > 0 && `· ${doneLabel}`}
          </p>
        </div>
        {children}
      </Reveal>
    </>
  );
}
