import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ProjectCard } from "@/components/ui/ProjectCard";
import type { Project } from "@/content/projects";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";

export type ProjectGridProps = {
  lang: Locale;
  copy: Dictionary["projects"];
  projects: Project[];
  id?: string;
  index?: string;
};

export function ProjectGrid({ lang, copy, projects, id = "autres-projets", index = "03" }: ProjectGridProps) {
  return (
    <section id={id} aria-label={copy.otherAria} className="bg-cream-deep/40 py-24 md:py-36">
      <Container>
        <Eyebrow index={index}>{copy.otherEyebrow}</Eyebrow>
        <h2 className="mt-6 max-w-5xl text-h2 font-medium">{copy.otherTitle}</h2>
        <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:mt-20">
          {projects.map((project) => {
            const cover = project.images[0];
            return (
              <li key={project.slug} data-project={project.slug}>
                <ProjectCard
                  href={`/${lang}/projets/${project.slug}`}
                  title={project.title}
                  category={t(project.category, lang)}
                  year={project.year}
                  summary={t(project.summary, lang)}
                  award={project.award ? t(project.award, lang) : undefined}
                  tags={project.tags.slice(0, 3)}
                  image={cover ? { src: cover.src, alt: t(cover.alt, lang), width: cover.width, height: cover.height } : undefined}
                  compact
                />
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
