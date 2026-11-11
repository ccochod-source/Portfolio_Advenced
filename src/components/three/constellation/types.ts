export type SkillGroup = "ai" | "build" | "business";

export type ConstellationSkill = {
  id: string;
  label: string;
  group: SkillGroup;
  weight?: number;
  relatedProjects?: { slug: string; title: string }[];
};

export type ConstellationLabels = {
  groups: Record<SkillGroup, string>;
  relatedProjects: string;
  hint: string;
};

export type SkillsConstellationProps = {
  skills: ConstellationSkill[];
  labels: ConstellationLabels;
  /** Client-side only (functions cannot cross the server → client boundary). */
  projectHref?: (slug: string) => string;
  /** Serializable alternative usable from Server Components, e.g. `/en/projets`. */
  projectBasePath?: string;
  reducedMotion?: boolean;
  className?: string;
};

export const defaultProjectBasePath = "/fr/projets";

export const resolveProjectHref = (projectHref?: (slug: string) => string, projectBasePath = defaultProjectBasePath) =>
  projectHref ?? ((slug: string) => `${projectBasePath.replace(/\/$/, "")}/${slug}`);
