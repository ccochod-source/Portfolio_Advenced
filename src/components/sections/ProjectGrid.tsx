import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Container } from "@/components/ui/Container";
import { ProjectCard } from "@/components/ui/ProjectCard";
import type { Project } from "@/content/projects";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";
import { ProjectGridDisclosure } from "./ProjectGridDisclosure";

export type ProjectGridProps = {
  lang: Locale;
  copy: Dictionary["projects"];
  projects: Project[];
  id?: string;
  index?: string;
};

const TEASER_SIZE = 4;

export function ProjectGrid({ lang, copy, projects, id = "autres-projets", index = "03" }: ProjectGridProps) {
  const fill = (template: string, count: number) => template.replace("{count}", String(count));
  const teaser = projects.slice(0, TEASER_SIZE).map((project) => project.title);
  const rest = projects.length - teaser.length;

  return (
    <section id={id} aria-label={copy.otherAria} className="pt-24 pb-6 md:pt-36 md:pb-10">
      <Container>
        <ProjectGridDisclosure
          panelId={`${id}-grid`}
          index={index}
          eyebrow={copy.otherEyebrow}
          title={copy.otherTitle}
          count={fill(copy.otherCount, projects.length)}
          showLabel={fill(copy.otherShow, projects.length)}
          hideLabel={copy.otherHide}
          teaserLabel={copy.otherTeaser}
          teaser={teaser}
          more={rest > 0 ? fill(copy.otherMore, rest) : undefined}
        >
          <div className="pt-14 pb-16 md:pt-20 md:pb-24">
            <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          </div>
        </ProjectGridDisclosure>
      </Container>
    </section>
  );
}
