"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWebGL } from "../useWebGL";
import { ActivityPause } from "../ActivityPause";
import { Canvas } from "@react-three/fiber";
import { ConstellationScene } from "./ConstellationScene";
import { GROUP_TAILWIND, layoutSkills } from "./layout";
import { CANVAS_HEIGHT } from "./sizes";
import { SkillsConstellationFallback } from "./SkillsConstellationFallback";
import { resolveProjectHref, type SkillsConstellationProps } from "./types";

function useMediaQuery(query: string, fallback = false) {
  const [matches, setMatches] = useState(fallback);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

const noopHover = () => {};

export function SkillsConstellation({
  skills,
  labels,
  projectHref,
  projectBasePath,
  reducedMotion,
  className = "",
}: SkillsConstellationProps) {
  const href = resolveProjectHref(projectHref, projectBasePath);
  const container = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<number | null>(null);
  const labelRefs = useRef<(HTMLElement | null)[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [interacting, setInteracting] = useState(false);
  const [visible, setVisible] = useState(true);
  const webgl = useWebGL();

  const prefersReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const mobile = useMediaQuery("(max-width: 767px)");
  const touch = useMediaQuery("(pointer: coarse)");
  const reduced = reducedMotion ?? prefersReduced;

  const { nodes, edges } = useMemo(() => layoutSkills(skills, { vertical: mobile }), [skills, mobile]);
  const activeIndex = pinned ?? hovered ?? focused;
  const active = activeIndex !== null ? skills[activeIndex] : null;
  const linked = useMemo(() => {
    const set = new Set<number>();
    if (activeIndex === null) return set;
    for (const e of edges) {
      if (e.a === activeIndex) set.add(e.b);
      if (e.b === activeIndex) set.add(e.a);
    }
    return set;
  }, [edges, activeIndex]);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    let inView = true;
    let tabVisible = document.visibilityState === "visible";
    const apply = () => setVisible(inView && tabVisible);
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        apply();
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    const onVisibility = () => {
      tabVisible = document.visibilityState === "visible";
      apply();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [webgl, mobile, reduced]);

  useEffect(
    () => () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
      document.body.style.cursor = "";
    },
    [],
  );

  const onInteractStart = useCallback(() => {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    setInteracting(true);
  }, []);
  const onInteractEnd = useCallback(() => {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setInteracting(false), 2500);
  }, []);
  const onSelect = useCallback((index: number) => setPinned((p) => (p === index ? null : index)), []);

  if (!webgl || (reduced && mobile)) {
    return <SkillsConstellationFallback skills={skills} labels={labels} projectHref={href} className={className} />;
  }

  const autoRotate = !reduced && !interacting && activeIndex === null;
  const frameloop = !visible ? "never" : reduced ? "demand" : "always";
  const hint = (touch && labels.hintTouch) || labels.hint;

  return (
    <div ref={container} className={`grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch ${className}`}>
      <div className={`relative ${CANVAS_HEIGHT}`}>
        <div aria-hidden className="pointer-events-none absolute inset-[12%] rounded-[50%] border border-gold/[0.08]" />
        <span aria-hidden className="pointer-events-none absolute top-4 left-0 font-mono text-label text-cream-dim">✦ &nbsp; {String(skills.length).padStart(2, "0")}</span>
        <div aria-hidden className="absolute inset-0 touch-pan-y">
          {webgl && (
            <Canvas
              dpr={[1, 1.5]}
              gl={{ alpha: true, antialias: !mobile, powerPreference: "low-power" }}
              camera={{ position: [0, 0.8, 8.6], fov: 40 }}
              frameloop={frameloop}
              onPointerMissed={() => setPinned(null)}
              style={{ background: "transparent" }}
            >
              <ActivityPause frameloop={frameloop} />
              <ConstellationScene
                nodes={nodes}
                edges={edges}
                activeIndex={activeIndex}
                linked={linked}
                onHover={touch ? noopHover : setHovered}
                onSelect={onSelect}
                autoRotate={autoRotate}
                animate={!reduced}
                mobile={mobile}
                touch={touch}
                labelRefs={labelRefs}
                onInteractStart={onInteractStart}
                onInteractEnd={onInteractEnd}
              />
            </Canvas>
          )}
          {webgl && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {skills.map((skill, index) => (
                <span
                  key={skill.id}
                  ref={(el) => {
                    labelRefs.current[index] = el;
                  }}
                  className={`absolute left-0 top-0 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] opacity-0 transition-colors md:text-[11px] md:tracking-[0.14em] duration-300 ${
                    activeIndex === index ? "bg-night/95 text-gold" : "bg-night/75 text-cream"
                  }`}
                >
                  {skill.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <ul className="absolute left-0 top-0 z-10 m-0 flex list-none flex-wrap gap-1 p-0">
          {skills.map((skill, index) => (
            <li key={skill.id}>
              <button
                type="button"
                aria-pressed={pinned === index}
                onFocus={() => setFocused(index)}
                onBlur={() => setFocused((f) => (f === index ? null : f))}
                onClick={() => onSelect(index)}
                className="sr-only rounded-full bg-umber px-4 py-2 font-mono text-label uppercase tracking-[0.14em] text-cream focus:not-sr-only focus:m-1 focus:inline-flex focus:min-h-11 focus:items-center focus:border focus:border-cream/20"
              >
                {skill.label}
                <span className="sr-only"> — {labels.groups[skill.group]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <aside className="relative flex min-h-72 flex-col justify-between overflow-hidden rounded-xl border border-gold/20 bg-gradient-to-br from-umber/95 to-night/80 p-7 shadow-[inset_0_1px_0_#ffc14510,0_20px_80px_#140b0720] backdrop-blur-md md:p-8">
        <p className="sr-only" aria-live="polite">
          {active ? (labels.status ?? "{skill} — {group}").replace("{skill}", active.label).replace("{group}", labels.groups[active.group]) : ""}
        </p>
        {active ? (
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-label uppercase text-cream-dim">
              <span aria-hidden className={`size-2 rounded-full ${GROUP_TAILWIND[active.group]}`} />
              {labels.groups[active.group]}
            </span>
            <h3 className="mt-4 text-h3 font-medium">{active.label}</h3>
            {active.description ? <p className="mt-2 max-w-md text-sm text-cream-muted">{active.description}</p> : null}
            {active.weight ? (
              <div className="mt-4 flex gap-1" aria-hidden>
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`h-1 w-6 rounded-full ${i < Math.min(active.weight ?? 0, 5) ? "bg-sun" : "bg-cream/15"}`} />
                ))}
              </div>
            ) : null}
            {active.relatedProjects?.length ? (
              <div className="mt-8">
                <p className="font-mono text-label uppercase text-cream-dim">{labels.relatedProjects}</p>
                <ul className="mt-3 divide-y divide-cream/15 border-y border-cream/15">
                  {active.relatedProjects.map((p) => (
                    <li key={p.slug}>
                      <a
                        href={href(p.slug)}
                        className="group flex min-h-11 items-center justify-between gap-4 py-3 text-sm font-medium underline decoration-cream/30 underline-offset-4 transition-colors hover:text-gold hover:decoration-current"
                      >
                        {p.title}
                        <span aria-hidden className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1">
                          →
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <div>
            <span aria-hidden className="block text-5xl leading-none text-gold">✳</span>
            {labels.explore && <h3 className="mt-8 text-[2rem] leading-[1.05] tracking-[-0.04em] text-cream">{labels.explore}</h3>}
            <p className="mt-5 max-w-xs text-base leading-relaxed text-cream-muted">{hint}</p>
          </div>
        )}

        <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 font-mono text-label uppercase text-cream-dim">
          {(["ai", "build", "business"] as const).map((group) => (
            <li key={group} className="flex items-center gap-2">
              <span aria-hidden className={`size-2 rounded-full ${GROUP_TAILWIND[group]}`} />
              {labels.groups[group]}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
