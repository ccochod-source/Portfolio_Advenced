import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Reveal, TextReveal } from "@/components/motion";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MacBook } from "@/components/ui/MacBook";
import { projectCover, type Project, type ProjectImage } from "@/content/projects";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";
import { MockupMotion } from "./SelectedWorkMotion";

export type FeaturedProjectsProps = {
  lang: Locale;
  copy: Dictionary["projects"];
  hud: Dictionary["hud"]["sections"]["selectedWork"];
  projects: Project[];
  id?: string;
  index?: string;
};

/** « Selected Work »: a half-viewport header with the gradient wordmark, then one laptop card per featured project (mock-up beside the copy from lg up, alternating sides). */
export function FeaturedProjects({ lang, copy, hud, projects, id = "projets", index = "02" }: FeaturedProjectsProps) {
  return (
    <section id={id} aria-label={copy.featuredAria} className="pt-20 md:pt-28">
      <Container
        data-hud-left={hud.left}
        data-hud-center={hud.center}
        data-hud-right={hud.right}
        className="flex min-h-[48svh] flex-col md:min-h-[52svh]"
      >
        <Eyebrow index={index}>{copy.eyebrow}</Eyebrow>
        <TextReveal
          as="h2"
          type="words"
          className="selected-work-wordmark mt-auto w-full pt-14 font-medium md:pt-20"
        >
          {copy.wordmark}
        </TextReveal>
      </Container>

      <ol className="mt-10 md:mt-12">
        {projects.map((project, i) => {
          const cover = projectCover(project);
          const href = `/${lang}/projets/${project.slug}`;
          const role = project.roleShort ?? project.role;
          const portrait = cover ? cover.height > cover.width : false;
          // Landscape captures keep their own ratio (16:10 to 16:9) so `object-cover` never trims their sides.
          const aspect = cover && !portrait ? Math.min(16 / 9, Math.max(16 / 10, cover.width / cover.height)) : undefined;
          return (
            <li key={project.slug} data-project={project.slug} className={i % 2 === 1 ? "bg-umber/40" : ""}>
              <Container className="grid min-h-[70svh] content-center items-center gap-10 py-14 md:gap-12 md:py-16 lg:grid-cols-12 lg:gap-16">
                <MockupMotion className={`mx-auto w-full max-w-[880px] lg:col-span-7 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                  <Link
                    href={href}
                    aria-label={`${copy.view} : ${project.title}`}
                    data-cursor="view"
                    className="group relative block rounded-[2rem] outline-offset-8"
                  >
                    <MacBook aspect={aspect}>
                      {cover && (
                        <Image
                          src={cover.src}
                          alt={"alt" in cover ? t(cover.alt as ProjectImage["alt"], lang) : project.title}
                          width={cover.width}
                          height={cover.height}
                          sizes="(max-width: 768px) calc(100vw - 3rem), (max-width: 1024px) 880px, (max-width: 1280px) 54vw, 700px"
                          preload={i === 0}
                          loading={i === 0 ? "eager" : "lazy"}
                          className={`absolute inset-0 size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] ${portrait ? "object-[50%_58%]" : "object-top"}`}
                        />
                      )}
                      <span aria-hidden className="absolute inset-0 bg-night/0 transition-colors duration-500 group-hover:bg-night/10" />
                    </MacBook>
                    {/* Under md the pill sits below the laptop so it never covers the capture. */}
                    <span
                      aria-hidden
                      className="mx-auto mt-4 flex w-fit items-center gap-2 whitespace-nowrap rounded-full bg-night/90 px-5 py-3 text-sm font-medium text-cream shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)] backdrop-blur transition-transform duration-500 ease-out-expo group-hover:scale-105 md:absolute md:left-1/2 md:top-[44%] md:mt-0 md:-translate-x-1/2 md:-translate-y-1/2 md:px-6 md:py-3.5 md:text-base"
                    >
                      {copy.view}
                      <span className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1">→</span>
                    </span>
                  </Link>
                </MockupMotion>

                <Reveal className="grid gap-8 md:grid-cols-12 md:gap-12 lg:col-span-5 lg:block">
                  <div className="md:col-span-7">
                    <p className="flex flex-wrap items-center gap-3 font-mono text-label uppercase text-cream-dim">
                      <span className="text-cream-dim">0{i + 1}</span>
                      <span>{t(project.category, lang)}</span>
                    </p>
                    <h3 className="mt-5 text-h2 font-medium">
                      <Link href={href} className="transition-colors hover:text-gold">
                        {project.title}
                      </Link>
                    </h3>
                    {project.award && (
                      <Badge tone="gold" className="mt-5">
                        ★ {t(project.award, lang)}
                      </Badge>
                    )}
                  </div>
                  <div className="md:col-span-5 lg:mt-6">
                    <p className="text-lead text-cream-muted">{t(project.summary, lang)}</p>
                    <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-cream-muted/15 pt-6">
                      <div>
                        <dt className="font-mono text-label uppercase text-cream-dim">{copy.yearLabel}</dt>
                        <dd className="mt-2 font-medium">{project.year}</dd>
                      </div>
                      <div>
                        <dt className="font-mono text-label uppercase text-cream-dim">{copy.roleLabel}</dt>
                        <dd className="mt-2 font-medium">{t(role, lang)}</dd>
                      </div>
                    </dl>
                  </div>
                </Reveal>
              </Container>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
