import Link from "next/link";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { ConstellationSkill } from "@/components/three/constellation/types";
import { getProject } from "@/content/projects";
import { skillGroups, type Skill } from "@/content/skills";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";
import { SkillsVisual } from "./SkillsVisual";

export type SkillsProps = {
  lang: Locale;
  copy: Dictionary["skills"];
  skills: Skill[];
  id?: string;
  index?: string;
};

export function Skills({ lang, copy, skills, id = "stack", index = "04" }: SkillsProps) {
  const constellationSkills: ConstellationSkill[] = skills.map((skill) => ({
    id: skill.id,
    label: t(skill.label, lang),
    group: skill.group,
    description: t(skill.description, lang),
    weight: Math.min(5, Math.max(2, skill.relatedProjects.length + 1)),
    relatedProjects: skill.relatedProjects.flatMap((slug) => {
      const project = getProject(slug);
      return project ? [{ slug, title: project.title }] : [];
    }),
  }));
  const labels = { groups: copy.groups, relatedProjects: copy.related, hint: copy.hint, hintTouch: copy.hintTouch, status: copy.status };

  return (
    <section id={id} className="py-24 md:py-36">
      <Container>
        <Eyebrow index={index}>{copy.eyebrow}</Eyebrow>
        <h2 className="mt-6 max-w-5xl text-h2 font-medium">{copy.title}</h2>

        <SkillsVisual skills={constellationSkills} labels={labels} projectBasePath={`/${lang}/projets`} listLabel={copy.fullList}>
          <div id="skills-visual" className="grid gap-16 lg:grid-cols-3 lg:gap-10">
            {skillGroups.map((group, gi) => {
              const items = skills.filter((s) => s.group === group.id);
              return (
                <div key={group.id} data-skill-group={group.id}>
                  <h3 className="flex items-center gap-3 font-mono text-label uppercase text-ink-soft">
                    <span className="text-sun-deep">{String(gi + 1).padStart(2, "0")}</span>
                    {t(group.label, lang)}
                  </h3>
                  <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
                    {items.map((skill) => (
                      <li key={skill.id} data-skill={skill.id} className="py-5">
                        <p className={gi === 0 ? "text-h3 font-medium" : "text-xl font-medium tracking-tight"}>{t(skill.label, lang)}</p>
                        <p className="mt-1 max-w-md text-sm text-ink-soft">{t(skill.description, lang)}</p>
                        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-label text-ink-soft" aria-label={copy.related}>
                          {skill.relatedProjects.map((slug) => {
                            const project = getProject(slug);
                            return project ? (
                              <li key={slug}>
                                <Link href={`/${lang}/projets/${slug}`} className="touch-target inline-block py-1 underline decoration-ink/30 underline-offset-4 hover:text-sun-deep hover:decoration-current">
                                  {project.title}
                                </Link>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </SkillsVisual>
      </Container>
    </section>
  );
}
