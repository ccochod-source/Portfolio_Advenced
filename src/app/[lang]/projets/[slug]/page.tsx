import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getNextProject, getProject, projects } from "@/content/projects";
import { getSkill } from "@/content/skills";
import { t } from "@/content/types";
import { getDictionary, getLocale } from "../../dictionaries";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/projets/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const lang = await getLocale();
  const title = `${project.title} — Clément Cochod`;
  const description = t(project.summary, lang);
  const cover = project.images[0];
  return {
    title,
    description,
    alternates: { languages: { fr: `/fr/projets/${slug}`, en: `/en/projets/${slug}` } },
    openGraph: cover ? { title, description, images: [{ url: cover.src, alt: t(cover.alt, lang) }] } : { title, description },
  };
}

export default async function ProjectPage({ params }: PageProps<"/[lang]/projets/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const [dict, lang] = await Promise.all([getDictionary(), getLocale()]);
  const copy = dict.project;
  const next = getNextProject(slug);
  const [cover, ...gallery] = project.images;
  const nextCover = next.images[0];

  return (
    <>
      <main className="pt-28 md:pt-36">
        <Container>
          <Link href={`/${lang}#projets`} className="group inline-flex items-center gap-2 font-mono text-label uppercase text-ink-soft hover:text-ink">
            <span aria-hidden className="transition-transform duration-300 ease-out-expo group-hover:-translate-x-1">
              ←
            </span>
            {copy.back}
          </Link>

          <header className="mt-10 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Eyebrow>
                {copy.eyebrow} · {t(project.category, lang)} · {project.year}
              </Eyebrow>
              <h1 className="mt-6 text-h1 font-medium">{project.title}</h1>
              {project.award && (
                <Badge tone="gold" className="mt-6">
                  ★ {t(project.award, lang)}
                </Badge>
              )}
              <p className="mt-8 max-w-3xl text-lead text-ink-soft">{t(project.summary, lang)}</p>
            </div>
            <dl className="grid gap-6 self-end border-t border-ink/10 pt-6 font-mono text-label lg:col-span-4 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              <div>
                <dt className="uppercase text-ink-soft">{copy.year}</dt>
                <dd className="mt-1 text-base font-sans">{project.year}</dd>
              </div>
              <div>
                <dt className="uppercase text-ink-soft">{copy.category}</dt>
                <dd className="mt-1 text-base font-sans">{t(project.category, lang)}</dd>
              </div>
              <div>
                <dt className="uppercase text-ink-soft">{copy.stack}</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </dd>
              </div>
            </dl>
          </header>

          {cover && (
            <figure className="sunset-card relative mt-14 aspect-[16/9] overflow-hidden rounded-[2rem] md:mt-20">
              <Image
                src={cover.src}
                alt={t(cover.alt, lang)}
                width={cover.width}
                height={cover.height}
                sizes="(max-width: 1440px) 100vw, 1440px"
                preload
                className={`absolute inset-0 size-full ${project.slug === "brasserie-de-tahiti" ? "object-contain p-16 md:p-28" : "object-cover"}`}
              />
            </figure>
          )}

          <section className="mt-20 grid gap-12 md:mt-28 md:grid-cols-2 md:gap-16">
            <div>
              <Eyebrow index="01">{copy.context}</Eyebrow>
              <p className="mt-6 text-lead">{t(project.context, lang)}</p>
            </div>
            <div>
              <Eyebrow index="02">{copy.role}</Eyebrow>
              <p className="mt-6 text-lead">{t(project.role, lang)}</p>
              {project.skills.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2" aria-label={copy.skills}>
                  {project.skills.map((id) => {
                    const skill = getSkill(id);
                    return skill ? (
                      <li key={id}>
                        <Link href={`/${lang}#stack`}>
                          <Badge tone="dark">{t(skill.label, lang)}</Badge>
                        </Link>
                      </li>
                    ) : null;
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="mt-20 md:mt-28">
            <Eyebrow index="03">{copy.approach}</Eyebrow>
            <ol className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
              {project.approach.map((step, i) => (
                <li key={i} className="grid gap-4 py-8 md:grid-cols-[6rem_1fr]">
                  <span className="font-mono text-label text-sun">{String(i + 1).padStart(2, "0")}</span>
                  <p className="max-w-3xl text-lg">{t(step, lang)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-20 md:mt-28">
            <Eyebrow index="04">{copy.results}</Eyebrow>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {project.results.map((result, i) => (
                <li key={i} className="rounded-[1.5rem] bg-cream-deep/60 p-6 text-lg font-medium leading-snug">
                  {t(result, lang)}
                </li>
              ))}
            </ul>
          </section>

          {gallery.length > 0 && (
            <section className="mt-20 md:mt-28">
              <Eyebrow index="05">{copy.gallery}</Eyebrow>
              <ul className={`mt-8 grid gap-6 ${gallery.length > 1 ? "md:grid-cols-2" : ""}`}>
                {gallery.map((image) => (
                  <li key={image.src} className="overflow-hidden rounded-[1.5rem] border border-ink/10 bg-cream-deep/40">
                    <Image
                      src={image.src}
                      alt={t(image.alt, lang)}
                      width={image.width}
                      height={image.height}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="h-auto w-full"
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-20 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-10 md:mt-28">
            {project.links?.map((link) => (
              <Button key={link.href} href={link.href} variant={link.kind === "github" ? "primary" : "secondary"} arrow>
                {t(link.label, lang)}
              </Button>
            ))}
            <Button href={`/${lang}#contact`} variant={project.links?.length ? "link" : "primary"} arrow>
              {copy.contact}
            </Button>
          </section>
        </Container>

        <Container className="mt-24 md:mt-36">
          <Link
            href={`/${lang}/projets/${next.slug}`}
            className="group grid items-center gap-8 rounded-[2rem] bg-ink p-8 text-cream transition-colors hover:bg-ink-soft md:grid-cols-12 md:p-12"
          >
            <div className="md:col-span-8">
              <p className="font-mono text-label uppercase text-cream/60">{copy.next}</p>
              <p className="mt-4 text-h2 font-medium">{next.title}</p>
              <p className="mt-3 font-mono text-label uppercase text-cream/60">{t(next.category, lang)}</p>
            </div>
            {nextCover && (
              <div className="sunset-card relative aspect-[4/3] overflow-hidden rounded-[1.5rem] md:col-span-4">
                <Image
                  src={nextCover.src}
                  alt=""
                  width={nextCover.width}
                  height={nextCover.height}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={`absolute inset-0 size-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.04] ${next.slug === "brasserie-de-tahiti" ? "object-contain p-8" : "object-cover"}`}
                />
              </div>
            )}
          </Link>
        </Container>
      </main>
      <Footer />
    </>
  );
}
