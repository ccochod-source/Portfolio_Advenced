import Link from "next/link";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getProject } from "@/content/projects";
import { skillGroups, type Skill } from "@/content/skills";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";

export type SkillsProps = {
  lang: Locale;
  copy: Dictionary["skills"];
  skills: Skill[];
  id?: string;
  index?: string;
};

export function Skills({ lang, copy, skills, id = "stack", index = "04" }: SkillsProps) {
  return (
    <section id={id} className="py-24 md:py-36">
      <Container>
        <Eyebrow index={index}>{copy.eyebrow}</Eyebrow>
        <h2 className="mt-6 max-w-5xl text-h2 font-medium">{copy.title}</h2>

        <div id="skills-visual" className="relative mt-14 md:mt-20">
          <div className="grid gap-16 lg:grid-cols-3 lg:gap-10">
            {skillGroups.map((group, gi) => {
              const items = skills.filter((s) => s.group === group.id);
              return (
                <div key={group.id} data-skill-group={group.id}>
                  <h3 className="flex items-center gap-3 font-mono text-label uppercase text-ink-soft">
                    <span className="text-sun">{String(gi + 1).padStart(2, "0")}</span>
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
                                <Link href={`/${lang}/projets/${slug}`} className="underline-offset-4 hover:text-sun hover:underline">
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
        </div>
      </Container>
    </section>
  );
}
