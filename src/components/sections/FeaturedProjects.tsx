import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Reveal, TextReveal } from "@/components/motion";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { projectCover, type Project } from "@/content/projects";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";
import type { GalleryItem } from "@/lib/gallery/types";
import { SelectedWorkGallery, type GalleryCopy } from "./SelectedWorkMotion";

export type FeaturedProjectsProps = {
  lang: Locale;
  copy: Dictionary["projects"];
  hud: Dictionary["hud"]["sections"]["selectedWork"];
  projects: Project[];
  id?: string;
  index?: string;
};

/** « Selected Work »: the sunset-gradient wordmark, then the curved gallery of the featured projects. */
export function FeaturedProjects({ lang, copy, hud, projects, id = "projets", index = "02" }: FeaturedProjectsProps) {
  const items: GalleryItem[] = projects.map((project) => {
    const cover = projectCover(project);
    return {
      slug: project.slug,
      href: `/${lang}/projets/${project.slug}`,
      title: project.title,
      category: t(project.category, lang),
      year: project.year,
      role: t(project.roleShort ?? project.role, lang),
      cover: { src: cover.src, width: cover.width, height: cover.height, alt: project.images[0] ? t(project.images[0].alt, lang) : project.title },
    };
  });
  const galleryCopy: GalleryCopy = {
    aria: copy.galleryAria,
    drag: copy.galleryDrag,
    open: copy.galleryOpen,
    hint: copy.galleryHint,
    swipe: copy.gallerySwipe,
    listLabel: copy.galleryListLabel,
    current: copy.galleryCurrent,
    opening: copy.galleryOpening,
    yearLabel: copy.yearLabel,
    roleLabel: copy.roleLabel,
    categoryLabel: copy.galleryCategoryLabel,
    hudCenter: hud.center,
  };

  return (
    <section id={id} aria-label={copy.featuredAria} className="pt-20 md:pt-28">
      <Container
        data-hud-left={hud.left}
        data-hud-center={hud.center}
        data-hud-right={hud.right}
        className="flex min-h-[60svh] flex-col pb-10 md:min-h-[72svh] md:pb-16"
      >
        <Eyebrow index={index}>{copy.eyebrow}</Eyebrow>
        <TextReveal as="h2" type="words" className="selected-work-wordmark mt-auto w-full pt-14 font-medium md:pt-20">
          {copy.wordmark}
        </TextReveal>
        <Reveal className="mt-8 md:mt-10">
          <p className="max-w-[34ch] text-lead text-cream-muted">{copy.galleryIntro}</p>
        </Reveal>
      </Container>

      <SelectedWorkGallery items={items} copy={galleryCopy} hud={hud} />
    </section>
  );
}
