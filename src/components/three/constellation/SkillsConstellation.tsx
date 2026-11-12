"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWebGL } from "../useWebGL";
import { ActivityPause } from "../ActivityPause";
import { Canvas } from "@react-three/fiber";
import { ConstellationScene } from "./ConstellationScene";
import { GROUP_TAILWIND, layoutSkills } from "./layout";
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
  }, []);

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

  if (!webgl) {
    return <SkillsConstellationFallback skills={skills} labels={labels} projectHref={href} className={className} />;
  }

  const autoRotate = !reduced && !interacting && activeIndex === null;

  return (
    <div ref={container} className={`grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_22rem] ${className}`}>
      <div className="relative h-[115vw] min-h-[24rem] max-h-[42rem] md:h-[60vw] lg:h-[36rem] xl:h-[40rem]">
        <div aria-hidden className="absolute inset-0 touch-none">
          {webgl && (
            <Canvas
              dpr={[1, 1.5]}
              gl={{ alpha: true, antialias: !mobile, powerPreference: "low-power" }}
              camera={{ position: [0, 0.8, 8.6], fov: 40 }}
              frameloop={visible ? "always" : "never"}
              onPointerMissed={() => setPinned(null)}
              style={{ background: "transparent" }}
            >
              <ActivityPause frameloop={visible ? "always" : "never"} />
              <ConstellationScene
                nodes={nodes}
                edges={edges}
                activeIndex={activeIndex}
                linked={linked}
                onHover={setHovered}
                onSelect={onSelect}
                autoRotate={autoRotate}
                animate={!reduced}
                mobile={mobile}
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
                    activeIndex === index ? "bg-ink text-cream" : "text-ink"
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
                className="sr-only rounded-full bg-cream px-4 py-2 font-mono text-label uppercase tracking-[0.14em] text-ink focus:not-sr-only focus:m-1 focus:inline-flex focus:min-h-11 focus:items-center focus:border focus:border-ink/20"
              >
                {skill.label}
                <span className="sr-only"> — {labels.groups[skill.group]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <aside className="flex flex-col justify-between rounded-3xl border border-ink/10 bg-cream-deep/50 p-6 backdrop-blur-sm md:p-8">
        <p className="sr-only" aria-live="polite">
          {active ? (labels.status ?? "{skill} — {group}").replace("{skill}", active.label).replace("{group}", labels.groups[active.group]) : ""}
        </p>
        {active ? (
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-label uppercase text-ink-soft">
              <span aria-hidden className={`size-2 rounded-full ${GROUP_TAILWIND[active.group]}`} />
              {labels.groups[active.group]}
            </span>
            <h3 className="mt-4 text-h3 font-medium">{active.label}</h3>
            {active.weight ? (
              <div className="mt-4 flex gap-1" aria-hidden>
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`h-1 w-6 rounded-full ${i < Math.min(active.weight ?? 0, 5) ? "bg-sun" : "bg-ink/10"}`} />
                ))}
              </div>
            ) : null}
            {active.relatedProjects?.length ? (
              <div className="mt-8">
                <p className="font-mono text-label uppercase text-ink-soft">{labels.relatedProjects}</p>
                <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
                  {active.relatedProjects.map((p) => (
                    <li key={p.slug}>
                      <a
                        href={href(p.slug)}
                        className="group flex min-h-11 items-center justify-between gap-4 py-3 text-sm font-medium underline decoration-ink/30 underline-offset-4 transition-colors hover:text-sun-deep hover:decoration-current"
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
          <p className="max-w-xs text-lead text-ink-soft">{labels.hint}</p>
        )}

        <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 font-mono text-label uppercase text-ink-soft">
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
