"use client";

import { useRef, type CSSProperties } from "react";
import { Pin } from "../Pin";

type PinDemoProps = {
  id: string;
  eyebrow: string;
  title: string;
  steps: string[];
  hint: string;
};

const css = (style: Record<string, string | number>) => style as CSSProperties;

export function PinDemo({ id, eyebrow, title, steps, hint }: PinDemoProps) {
  const readout = useRef<HTMLSpanElement>(null);

  return (
    <Pin
      id={id}
      length={1.5}
      className="scroll-mt-0"
      innerClassName="relative flex h-svh flex-col justify-between overflow-hidden bg-night px-6 pb-10 pt-28 text-cream md:px-12"
      onProgress={(progress) => {
        if (readout.current) readout.current.textContent = `${Math.round(progress * 100)} %`;
      }}
    >
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-ember/80 via-umber to-night" style={css({ opacity: "var(--progress)" })} />
      <div
        aria-hidden
        className="absolute right-[12%] top-[14%] size-[22vmin] rounded-full bg-gold will-change-transform"
        style={css({ transform: "translateY(calc(var(--progress) * 52vh)) scale(calc(1 + var(--progress) * 0.9))" })}
      >
        <div className="size-full rounded-full bg-coral" style={css({ opacity: "calc(var(--progress) * 0.85)" })} />
      </div>

      <div className="relative flex items-center justify-between font-mono text-label uppercase">
        <span>{eyebrow}</span>
        <span>
          --progress <span ref={readout}>0 %</span>
        </span>
      </div>

      <div className="relative">
        <h2 className="max-w-4xl text-h1 font-medium">{title}</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className="border-t border-cream/25 pt-4 text-lead"
              style={css({
                opacity: `clamp(0.3, calc((var(--progress) - ${(index / steps.length).toFixed(3)}) * 12 + 0.3), 1)`,
              })}
            >
              <span className="mr-3 font-mono text-label text-cream-dim">0{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-cream/20">
            <div className="h-px origin-left bg-cream" style={css({ transform: "scaleX(var(--progress))" })} />
          </div>
          <span className="font-mono text-label uppercase text-cream-dim">{hint}</span>
        </div>
      </div>
    </Pin>
  );
}
