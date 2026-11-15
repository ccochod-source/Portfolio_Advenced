import { GROUP_TAILWIND } from "./layout";
import { resolveProjectHref, type SkillGroup, type SkillsConstellationProps } from "./types";

const ORDER: SkillGroup[] = ["ai", "build", "business"];

export function SkillsConstellationFallback({
  skills,
  labels,
  projectHref,
  projectBasePath,
  className = "",
}: Omit<SkillsConstellationProps, "reducedMotion">) {
  const href = resolveProjectHref(projectHref, projectBasePath);
  return (
    <div className={`grid gap-10 rounded-xl border border-gold/20 bg-night/60 p-6 md:grid-cols-3 md:p-8 ${className}`}>
      {ORDER.map((group) => {
        const list = skills.filter((s) => s.group === group);
        if (!list.length) return null;
        return (
          <section key={group}>
            <h3 className="flex items-center gap-2 font-mono text-label uppercase text-cream-dim">
              <span aria-hidden className={`size-2 rounded-full ${GROUP_TAILWIND[group]}`} />
              {labels.groups[group]}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {list.map((s) => (
                <li key={s.id} className="text-sm">
                  <details className="group/skill rounded-2xl border border-cream/20 px-3 open:bg-umber">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 text-cream marker:hidden [&::-webkit-details-marker]:hidden">{s.label}<span aria-hidden className="ml-auto text-gold">+</span></summary>
                    <div className="max-w-sm pb-4">
                      <p className="text-cream-muted">{s.description}</p>
                      {s.relatedProjects?.length ? <p className="mt-4 font-mono text-label text-cream-dim">{labels.relatedProjects}</p> : null}
                      <ul>{s.relatedProjects?.map((p) => <li key={p.slug}><a className="flex min-h-11 items-center text-cream underline decoration-gold/50 underline-offset-4 hover:text-gold" href={href(p.slug)}>{p.title} ↗</a></li>)}</ul>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
