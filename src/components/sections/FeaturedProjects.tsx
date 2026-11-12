import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Counter, Parallax, Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { Project } from "@/content/projects";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";

export type FeaturedProjectsProps = {
  lang: Locale;
  copy: Dictionary["projects"];
  projects: Project[];
  id?: string;
  index?: string;
};

export function FeaturedProjects({ lang, copy, projects, id = "projets", index = "02" }: FeaturedProjectsProps) {
  return (
    <section id={id} aria-label={copy.featuredAria} className="py-24 md:py-36">
      <Container>
        <Eyebrow index={index}>{copy.eyebrow}</Eyebrow>
        <h2 className="mt-6 max-w-5xl text-h2 font-medium">{copy.title}</h2>

        <Reveal as="ul" stagger className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 border-y border-ink/10 py-10 md:mt-20 lg:grid-cols-4" aria-label={copy.figuresAria}>
          {copy.figures.map((figure) => (
            <li key={figure.label}>
              <p className="text-h2 font-medium tabular-nums">
                <Counter value={figure.value} locale={lang} prefix={figure.prefix} suffix={figure.suffix} />
              </p>
              <p className="mt-2 max-w-[14rem] font-mono text-label uppercase text-ink-soft">{figure.label}</p>
            </li>
          ))}
        </Reveal>

        <ol className="mt-16 flex flex-col gap-24 md:mt-24 md:gap-36">
          {projects.map((project, i) => {
            const cover = project.images[0];
            const reversed = i % 2 === 1;
            const href = `/${lang}/projets/${project.slug}`;
            return (
              <Reveal
                as="li"
                key={project.slug}
                data-project={project.slug}
                className="grid items-center gap-8 md:grid-cols-12 md:gap-12"
              >
                {/* Decorative duplicate of the title link below: not in the tab order, not announced. */}
                <Link
                  href={href}
                  aria-hidden
                  tabIndex={-1}
                  data-cursor="view"
                  className={`group relative block overflow-hidden rounded-[2rem] sunset-card md:col-span-7 ${reversed ? "md:order-2" : ""} ${i === 0 ? "aspect-[4/3]" : "aspect-[5/4] md:aspect-[4/3]"}`}
                >
                  {cover && (
                    <Parallax cover speed={0.1} className="absolute inset-0" innerClassName="relative size-full">
                    <Image
                      src={cover.src}
                      alt={t(cover.alt, lang)}
                      width={cover.width}
                      height={cover.height}
                      sizes="(max-width: 768px) calc(100vw - 2rem), (max-width: 1280px) 56vw, 760px"
                      preload={i === 0}
                      loading={i === 0 ? "eager" : "lazy"}
                      className={`absolute inset-0 size-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] ${project.slug === "brasserie-de-tahiti" ? "object-contain p-12 md:p-20" : "object-cover"}`}
                    />
                    </Parallax>
                  )}
                  {project.award && (
                    <Badge tone="gold" className="absolute left-6 top-6">
                      ★ {t(project.award, lang)}
                    </Badge>
                  )}
                </Link>

                <div className={`md:col-span-5 ${reversed ? "md:order-1" : ""}`}>
                  <p className="flex items-center gap-3 font-mono text-label uppercase text-ink-soft">
                    <span className="text-sun-deep">0{i + 1}</span>
                    <span>{t(project.category, lang)}</span>
                    <span aria-hidden>·</span>
                    <span>{project.year}</span>
                  </p>
                  <h3 className="mt-5 text-h2 font-medium">
                    <Link href={href} className="hover:text-sun transition-colors">
                      {project.title}
                    </Link>
                  </h3>
                  <p className="mt-6 text-lead text-ink-soft">{t(project.summary, lang)}</p>
                  <ul className="mt-6 flex flex-wrap gap-2" aria-label={copy.tagsAria}>
                    {project.tags.slice(0, 5).map((tag) => (
                      <li key={tag}>
                        <Badge>{tag}</Badge>
                      </li>
                    ))}
                  </ul>
                  <Link href={href} className="group mt-8 inline-flex min-h-11 items-center gap-2 font-medium underline decoration-ink/30 underline-offset-4 hover:decoration-current">
                    {copy.cta}
                    <span aria-hidden className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
