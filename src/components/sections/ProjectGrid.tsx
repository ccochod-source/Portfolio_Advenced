import type { Dictionary } from "@/app/[lang]/dictionaries";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { projectCover, type Project, type ProjectImage } from "@/content/projects";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";
import { ProjectGridDisclosure } from "./ProjectGridDisclosure";

export type ProjectGridProps = {
  lang: Locale;
  copy: Dictionary["projects"];
  hud: Dictionary["hud"]["sections"]["projectGrid"];
  projects: Project[];
  id?: string;
  index?: string;
};

const TEASER_SIZE = 4;

export function ProjectGrid({ lang, copy, hud, projects, id = "autres-projets", index = "03" }: ProjectGridProps) {
  const fill = (template: string, count: number) => template.replace("{count}", String(count));
  const teaser = projects.slice(0, TEASER_SIZE).map((project) => project.title);
  const rest = projects.length - teaser.length;
  const sectionHud = { ...hud, center: "CLÉMENT COCHOD — PORTFOLIO", right: `${index} / 05` };

  return (
    <section id={id} aria-label={copy.otherAria} data-hud-left={sectionHud.left} data-hud-center={sectionHud.center} data-hud-right={sectionHud.right} className="pt-24 pb-6 md:pt-36 md:pb-10">
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
          hud={sectionHud}
          previews={projects.map((project) => ({ src: projectCover(project)?.src, title: project.title }))}
        >
          <div className="pt-10 pb-6 md:pt-14">
            <ul className="grid gap-10 md:gap-0">
              {projects.map((project, i) => {
                const cover = projectCover(project);
                return (
                  <li key={project.slug} id={`archive-${project.slug}`} data-project={project.slug} data-cover-index={i} data-hud-left={sectionHud.left} data-hud-center={sectionHud.center} data-hud-right={sectionHud.right} className="group/row scroll-mt-22 border-b border-cream/20 md:first:border-t">
                    <Link
                      href={`/${lang}/projets/${project.slug}`}
                      className="grid min-h-28 gap-3 pb-6 transition-colors duration-500 hover:text-gold md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(10rem,0.55fr)_3rem_2rem] md:items-center md:gap-6 md:py-7"
                    >
                      {cover && <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-lg bg-umber md:hidden"><Image src={cover.src} alt={"alt" in cover ? t(cover.alt as ProjectImage["alt"], lang) : project.title} fill sizes="(max-width: 767px) 100vw, 1px" className="object-cover" /></div>}
                      <span aria-hidden className="hidden font-mono text-label text-cream-dim md:block">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="text-[clamp(1.75rem,3vw,3.25rem)] leading-none font-medium tracking-[-0.045em] transition-transform duration-500 ease-out-expo motion-safe:group-hover/row:translate-x-2">{project.title}</h3>
                      <span className="text-sm text-cream-muted">{t(project.category, lang)}</span>
                      <span className="font-mono text-label text-cream-dim">{project.year}</span>
                      <span aria-hidden className="hidden justify-self-end text-2xl text-sun md:block">↗</span>
                    </Link>
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
