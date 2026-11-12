import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Reveal, TextReveal } from "@/components/motion";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MacBook } from "@/components/ui/MacBook";
import type { Project } from "@/content/projects";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";
import { MockupMotion } from "./SelectedWorkMotion";

export type FeaturedProjectsProps = {
  lang: Locale;
  copy: Dictionary["projects"];
  projects: Project[];
  id?: string;
  index?: string;
};

/** « Selected Work »: a viewport-tall header with the gradient wordmark, then one full-bleed laptop card per featured project. */
export function FeaturedProjects({ lang, copy, projects, id = "projets", index = "02" }: FeaturedProjectsProps) {
  return (
    <section id={id} aria-label={copy.featuredAria} className="pt-24 md:pt-36">
      <Container className="flex min-h-[60svh] flex-col md:min-h-[72svh]">
        <Eyebrow index={index}>{copy.eyebrow}</Eyebrow>
        <TextReveal
          as="h2"
          type="words"
          className="selected-work-wordmark mt-auto w-full pt-16 font-medium md:pt-24"
        >
          {copy.wordmark}
        </TextReveal>
      </Container>

      <ol className="mt-16 md:mt-24">
        {projects.map((project, i) => {
          const cover = project.images[0];
          const href = `/${lang}/projets/${project.slug}`;
          const role = project.roleShort ?? project.role;
          const portrait = cover ? cover.height > cover.width : false;
          return (
            <li key={project.slug} data-project={project.slug} className={i % 2 === 1 ? "bg-cream-deep/40" : ""}>
              <Container className="flex min-h-[80svh] flex-col justify-center py-16 md:py-28">
                <MockupMotion className="mx-auto w-full max-w-[1120px]">
                  <Link
                    href={href}
                    aria-label={`${copy.view} : ${project.title}`}
                    data-cursor="view"
                    className="group relative block rounded-[2rem] outline-offset-8"
                  >
                    <MacBook>
                      {cover && (
                        <Image
                          src={cover.src}
                          alt={t(cover.alt, lang)}
                          width={cover.width}
                          height={cover.height}
                          sizes="(max-width: 768px) calc(100vw - 3rem), (max-width: 1280px) 78vw, 960px"
                          preload={i === 0}
                          loading={i === 0 ? "eager" : "lazy"}
                          className={`absolute inset-0 size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] ${portrait ? "object-[50%_58%]" : "object-top"}`}
                        />
                      )}
                      <span aria-hidden className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/10" />
                    </MacBook>
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-[44%] inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-cream/90 px-5 py-3 text-sm font-medium text-ink shadow-[0_12px_40px_-12px_rgba(43,26,18,0.45)] backdrop-blur transition-transform duration-500 ease-out-expo group-hover:scale-105 md:px-6 md:py-3.5 md:text-base"
                    >
                      {copy.view}
                      <span className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1">→</span>
                    </span>
                  </Link>
                </MockupMotion>

                <Reveal className="mt-14 grid gap-8 md:mt-20 md:grid-cols-12 md:gap-12">
                  <div className="md:col-span-7">
                    <p className="flex flex-wrap items-center gap-3 font-mono text-label uppercase text-ink-soft">
                      <span className="text-sun-deep">0{i + 1}</span>
                      <span>{t(project.category, lang)}</span>
                    </p>
                    <h3 className="mt-5 text-h2 font-medium">
                      <Link href={href} className="transition-colors hover:text-sun">
                        {project.title}
                      </Link>
                    </h3>
                    {project.award && (
                      <Badge tone="gold" className="mt-5">
                        ★ {t(project.award, lang)}
                      </Badge>
                    )}
                  </div>
                  <div className="md:col-span-5">
                    <p className="text-lead text-ink-soft">{t(project.summary, lang)}</p>
                    <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-ink/10 pt-6">
                      <div>
                        <dt className="font-mono text-label uppercase text-ink-soft">{copy.yearLabel}</dt>
                        <dd className="mt-2 font-medium">{project.year}</dd>
                      </div>
                      <div>
                        <dt className="font-mono text-label uppercase text-ink-soft">{copy.roleLabel}</dt>
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
