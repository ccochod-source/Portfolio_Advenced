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
    <div className={`grid gap-10 md:grid-cols-3 ${className}`}>
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
                <li key={s.id} className="rounded-full border border-cream/20 px-3 py-1 text-sm">
                  {s.label}
                  {s.relatedProjects?.length ? (
                    <span className="sr-only">
                      {" "}
                      — {labels.relatedProjects}: {s.relatedProjects.map((p) => p.title).join(", ")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            <ul className="sr-only">
              {list.flatMap((s) =>
                (s.relatedProjects ?? []).map((p) => (
                  <li key={`${s.id}-${p.slug}`}>
                    <a href={href(p.slug)}>{p.title}</a>
                  </li>
                )),
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
