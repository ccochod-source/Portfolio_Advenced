import { featuredProjects, otherProjects, projectCover, type Project } from "@/content/projects";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";

export type CaseImage = { src: string; width: number; height: number; alt: string };

/** Featured projects in Selected Work order, then the others: the reading order of the case studies. */
export const caseOrder: Project[] = [...featuredProjects, ...otherProjects];

export function casePosition(slug: string) {
  const index = Math.max(0, caseOrder.findIndex((p) => p.slug === slug));
  return { index, total: caseOrder.length, next: caseOrder[(index + 1) % caseOrder.length] };
}

export function caseCover(project: Project, lang: Locale): CaseImage {
  const cover = projectCover(project);
  return { src: cover.src, width: cover.width, height: cover.height, alt: project.cinematic && cover === project.cinematic ? project.title : t(project.images[0].alt, lang) };
}

/** Every image of the project, then its cinematic cover when it has one. */
export function caseGallery(project: Project, lang: Locale): CaseImage[] {
  const images: CaseImage[] = project.images.map((image) => ({ ...image, alt: t(image.alt, lang) }));
  if (project.cinematic && !images.some((image) => image.src === project.cinematic?.src)) {
    images.push({ ...project.cinematic, alt: project.title });
  }
  return images;
}

/** "Data Hub & Omni : couche sémantique…" → ["Data Hub & Omni", "couche sémantique…"]. */
export function splitLead(text: string): [string | null, string] {
  const match = /^([^:.]{2,48}?)\s?:\s+([\s\S]+)$/.exec(text);
  return match ? [match[1], match[2]] : [null, text];
}

const FIGURE = /(\d+(?:[\s\u202f\u00a0.,]\d{3})*(?:[.,]\d+)?\s?(?:%|\+)?)/g;

/** Splits a sentence around its figures so they can be highlighted. Odd indexes are figures. */
export function splitFigures(text: string): string[] {
  return text.split(FIGURE);
}

export function format(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
