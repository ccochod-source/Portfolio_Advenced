"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode, type TransitionEvent } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/ease";
import { getLenis, scrollTo } from "@/lib/motion/scroll";
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
  hud: { left: string; center: string; right: string };
  previews: { src?: string; title: string }[];
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
  hud,
  previews,
  children,
}: ProjectGridDisclosureProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const pendingAnchor = useRef<HTMLElement | null>(null);
  const move = useRef<{ x: (value: number) => void; y: (value: number) => void } | null>(null);
  const reduce = useReducedMotion();
  const headingId = `${panelId}-heading`;
  const finishLayout = useCallback(() => {
    syncScroll();
    if (pendingAnchor.current) {
      // Lenis and native scrolling both respect the row's scroll-margin-top.
      scrollTo(pendingAnchor.current, { immediate: reduce });
      pendingAnchor.current = null;
    }
  }, [reduce]);

  useEffect(() => {
    const el = preview.current;
    if (!el || reduce) return;
    move.current = { x: gsap.quickTo(el, "x", { duration: 0.6, ease: EASE.out }), y: gsap.quickTo(el, "y", { duration: 0.6, ease: EASE.out }) };
    return () => { gsap.killTweensOf(el); move.current = null; };
  }, [reduce]);

  useEffect(() => {
    let frame = 0;
    const revealAnchor = () => {
      let target: HTMLElement | null = null;
      try { target = document.getElementById(decodeURIComponent(window.location.hash.slice(1))); } catch {}
      const panel = document.getElementById(panelId);
      if (target && panel?.contains(target)) {
        pendingAnchor.current = target;
        setOpen(true);
        // With motion, align once expansion reaches its final height. An already-open panel needs no transition.
        if (reduce || !panel.inert) frame = requestAnimationFrame(finishLayout);
      }
    };
    revealAnchor();
    window.addEventListener("hashchange", revealAnchor);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", revealAnchor); };
  }, [panelId, reduce, finishLayout]);

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || !open || !window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)").matches) return;
    const row = (event.target as Element).closest<HTMLElement>("[data-cover-index]");
    if (!row) { setActive(null); return; }
    const next = Number(row.dataset.coverIndex);
    if (!previews[next]?.src) { setActive(null); return; }
    const x = Math.max(16, Math.min(window.innerWidth - 380, event.clientX + 32));
    const y = Math.max(90, Math.min(window.innerHeight - 290, event.clientY - 130));
    if (active === null) gsap.set(preview.current, { x, y });
    else { move.current?.x(x); move.current?.y(y); }
    setActive(next);
  };

  const toggle = () => {
    pendingAnchor.current = null;
    setActive(null);
    setOpen((value) => !value);
    // No transition under reduced motion, so no `transitionend`: refresh as soon as the DOM has the new height.
    if (reduce) requestAnimationFrame(syncScroll);
  };

  const onPanelTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.propertyName === "grid-template-rows") finishLayout();
  };

  return (
    <div className="border-t border-cream/20 pt-7">
      <div
        className="group relative"
        data-hud-left={hud.left}
        data-hud-center={hud.center}
        data-hud-right={hud.right}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Eyebrow index={index}>{eyebrow}</Eyebrow>
          <Badge>{count}</Badge>
        </div>
        <div className="mt-7 flex items-end justify-between gap-5">
          <h2 id={headingId} className="max-w-4xl text-[clamp(2.3rem,5.7vw,6rem)] leading-[0.98] font-medium tracking-[-0.05em]">
            {title}
          </h2>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={toggle}
            className="flex shrink-0 cursor-pointer items-center gap-4 rounded-full py-1 pl-3 font-mono text-label uppercase text-cream-dim transition-colors duration-300 hover:text-cream after:absolute after:inset-0 after:rounded-[1.75rem] after:content-['']"
          >
            <span className="sr-only xl:not-sr-only">{open ? hideLabel : showLabel}</span>
            <span
              aria-hidden
              className={`grid size-14 place-items-center rounded-full border border-cream/30 text-gold transition-[transform,background-color,color,border-color] duration-500 ease-out-expo motion-reduce:transition-none group-hover:border-gold group-hover:bg-gold group-hover:text-night md:size-20 ${open ? "rotate-180" : ""}`}
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
              <p className="flex flex-wrap items-center gap-2 pt-8 text-sm text-cream-muted">
                <span className="mr-1 font-mono text-label uppercase">{teaserLabel}</span>
                {teaser.map((name) => (
                  <span key={name} className="rounded-full border border-cream/15 bg-night/95 px-3 py-1 text-cream">
                    {name}
                  </span>
                ))}
                {more && <span className="rounded-full bg-night/95 px-3 py-1 font-mono text-label text-cream">{more}</span>}
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
        onPointerMove={follow}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        className={`${collapse} duration-700 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="min-h-0 overflow-hidden">
          {/* Side padding keeps the cards' focus rings and hover scale inside the clipped box. */}
          <div className="-mx-3 px-3">{children}</div>
        </div>
      </div>
      <div ref={preview} aria-hidden className={`pointer-events-none fixed top-0 left-0 z-30 hidden h-[250px] w-[350px] overflow-hidden rounded-lg border border-cream/20 bg-umber shadow-[0_30px_90px_#0008] transition-[opacity,scale] duration-300 ease-out-expo md:block ${open && active !== null ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
        {active !== null && previews[active]?.src && <Image src={previews[active].src!} alt="" fill sizes="350px" className="object-cover" />}
      </div>
    </div>
  );
}
