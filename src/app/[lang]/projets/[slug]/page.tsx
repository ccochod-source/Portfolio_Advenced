import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { CaseHero } from "@/components/case/CaseHero";
import { CaseHud } from "@/components/case/CaseHud";
import { CaseApproach, CaseGallery, CaseLinks, CaseOverview, CaseResults, type CaseLink, type MetaItem } from "@/components/case/CaseSections";
import { NextProject } from "@/components/case/NextProject";
import { caseCover, caseGallery, casePosition, format } from "@/components/case/order";
import { getProject, projects } from "@/content/projects";
import { getSkill } from "@/content/skills";
import { t } from "@/content/types";
import { absoluteUrl, localeAlternates } from "@/lib/site";
import { getDictionary, getLocale } from "../../dictionaries";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/projets/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const lang = await getLocale();
  const title = project.title;
  const description = t(project.summary, lang);
  const cover = caseCover(project, lang);
  const path = `/projets/${slug}`;
  const images = [{ url: absoluteUrl(cover.src), alt: cover.alt, width: cover.width, height: cover.height }];
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/${lang}${path}`), languages: localeAlternates(path) },
    openGraph: { type: "article", url: absoluteUrl(`/${lang}${path}`), title, description, images },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function ProjectPage({ params }: PageProps<"/[lang]/projets/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const [dict, lang] = await Promise.all([getDictionary(), getLocale()]);
  const copy = dict.caseStudy;
  const { index, total, next } = casePosition(slug);
  const category = t(project.category, lang);
  const award = project.award ? t(project.award, lang) : undefined;
  const hud = { "data-hud-left": project.title, "data-hud-center": category, "data-hud-right": project.year };
  const nextCategory = t(next.category, lang);

  const meta: MetaItem[] = [
    ...(project.roleShort ? [{ label: copy.role, value: t(project.roleShort, lang) }] : []),
    { label: copy.year, value: project.year },
    { label: copy.category, value: category },
    ...(award ? [{ label: copy.award, value: award }] : []),
    { label: copy.stack, value: project.tags },
  ];
  const skills = project.skills.flatMap((id) => {
    const skill = getSkill(id);
    return skill ? [t(skill.label, lang)] : [];
  });
  const links: CaseLink[] = [
    ...(project.links ?? []).map((link) => ({ href: link.href, label: t(link.label, lang), external: link.href.startsWith("http") })),
    { href: `/${lang}#contact`, label: copy.contact, external: false },
  ];

  return (
    <>
      <CaseHud left={project.title} center={category} right={project.year} />
      <main id="main" tabIndex={-1} className="outline-none">
        <CaseHero
          slug={slug}
          title={project.title}
          category={category}
          year={project.year}
          award={award}
          cover={caseCover(project, lang)}
          eyebrow={copy.eyebrow}
          counter={`${pad(index + 1)} / ${pad(total)}`}
          counterLabel={format(copy.counter, { current: index + 1, total })}
          backHref={`/${lang}#projets`}
          backLabel={copy.back}
          hud={hud}
        />
        <CaseOverview
          hud={hud}
          label={copy.overview}
          meta={meta}
          summary={t(project.summary, lang)}
          context={t(project.context, lang)}
          roleLabel={copy.myRole}
          role={t(project.role, lang)}
          skillsLabel={copy.skills}
          skills={skills}
          skillsHref={`/${lang}#stack`}
        />
        <CaseApproach hud={hud} label={copy.approach} steps={project.approach.map((step) => t(step, lang))} />
        <CaseResults hud={hud} label={copy.results} results={project.results.map((result) => t(result, lang))} />
        <CaseGallery hud={hud} label={copy.gallery} figureLabel={copy.figure} images={caseGallery(project, lang)} />
        <CaseLinks hud={hud} label={copy.links} links={links} newTab={copy.newTab} />
        <NextProject
          href={`/${lang}/projets/${next.slug}`}
          slug={next.slug}
          title={next.title}
          category={nextCategory}
          year={next.year}
          cover={caseCover(next, lang)}
          label={copy.next}
          cursorLabel={copy.nextCursor}
          hud={{ "data-hud-left": next.title, "data-hud-center": copy.next, "data-hud-right": next.year }}
        />
      </main>
      <Footer />
    </>
  );
}
