"use client";

import { useState, type ReactNode, type TransitionEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ScrollTrigger } from "@/lib/motion/gsap";
import { getLenis } from "@/lib/motion/scroll";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export type ProjectGridDisclosureProps = {
  /** Id of the collapsible panel (`aria-controls`). */
  panelId: string;
  index?: string;
  eyebrow: string;
  title: string;
  /** "8 projets" */
  count: string;
  /** "Voir les 8 projets" */
  showLabel: string;
  /** "Masquer" */
  hideLabel: string;
  /** "Dont" — intro of the teaser chips. */
  teaserLabel: string;
  /** Project names shown as chips while collapsed. */
  teaser: string[];
  /** "+4 autres" (omitted when every project is in the teaser). */
  more?: string;
  children: ReactNode;
};

/** Re-measure Lenis and ScrollTrigger once the panel has its final height, so pins and anchors below stay exact. */
function syncScroll() {
  getLenis()?.resize();
  ScrollTrigger.refresh();
}

const collapse = "grid transition-[grid-template-rows,opacity] ease-out-expo motion-reduce:transition-none";

export function ProjectGridDisclosure({
  panelId,
  index,
  eyebrow,
  title,
  count,
  showLabel,
  hideLabel,
  teaserLabel,
  teaser,
  more,
  children,
}: ProjectGridDisclosureProps) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const headingId = `${panelId}-heading`;

  const toggle = () => {
    setOpen((value) => !value);
    // No transition under reduced motion, so no `transitionend`: refresh as soon as the DOM has the new height.
    if (reduce) requestAnimationFrame(syncScroll);
  };

  const onPanelTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.propertyName === "grid-template-rows") syncScroll();
  };

  return (
    <div>
      <div className="group relative">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Eyebrow index={index}>{eyebrow}</Eyebrow>
          <Badge>{count}</Badge>
        </div>
        <div className="mt-6 flex items-end justify-between gap-6">
          <h2 id={headingId} className="max-w-5xl text-h2 font-medium">
            {title}
          </h2>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={toggle}
            className="flex shrink-0 cursor-pointer items-center gap-4 rounded-full py-1 pl-3 font-mono text-label uppercase text-ink-soft transition-colors duration-300 hover:text-ink after:absolute after:inset-0 after:rounded-[1.75rem] after:content-['']"
          >
            <span className="sr-only sm:not-sr-only">{open ? hideLabel : showLabel}</span>
            <span
              aria-hidden
              className={`grid size-12 place-items-center rounded-full border border-ink/25 bg-cream text-ink transition-[transform,background-color,color,border-color] duration-500 ease-out-expo group-hover:border-ink group-hover:bg-ink group-hover:text-cream md:size-14 ${open ? "rotate-180" : ""}`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </button>
        </div>

        {teaser.length > 0 && (
          <div
            aria-hidden={open}
            inert={open}
            className={`${collapse} duration-500 ${open ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
          >
            <div className="min-h-0 overflow-hidden">
              <p className="flex flex-wrap items-center gap-2 pt-8 text-sm text-ink-soft">
                <span className="mr-1 font-mono text-label uppercase">{teaserLabel}</span>
                {teaser.map((name) => (
                  <span key={name} className="rounded-full border border-ink/15 px-3 py-1">
                    {name}
                  </span>
                ))}
                {more && <span className="rounded-full bg-ink/5 px-3 py-1 font-mono text-label">{more}</span>}
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        inert={!open}
        onTransitionEnd={onPanelTransitionEnd}
        className={`${collapse} duration-700 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="min-h-0 overflow-hidden">
          {/* Side padding keeps the cards' focus rings and hover scale inside the clipped box. */}
          <div className="-mx-3 px-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
