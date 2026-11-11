import type { Metadata } from "next";
import { getLocale } from "@/app/[lang]/dictionaries";
import { Footer } from "@/components/Footer";
import { SkillsConstellationLazy, type ConstellationLabels, type ConstellationSkill } from "@/components/three/constellation";
import { Section } from "@/components/ui/Section";
import type { Locale } from "@/i18n";

export const metadata: Metadata = {
  title: "Lab — Constellation de compétences",
  robots: { index: false, follow: false },
};

const projects = {
  nami: { fr: "Nami — agent de voyage vocal", en: "Nami — voice travel agent" },
  payfit: { fr: "PayFit — rédaction assistée", en: "PayFit — assisted writing" },
  mirakl: { fr: "Mirakl — cas d'usage IA", en: "Mirakl — AI use case" },
  elevate: { fr: "Cochod Elevate — site & automatisations", en: "Cochod Elevate — site & automations" },
  essec: { fr: "ESSEC — gestion de projet", en: "ESSEC — project management" },
  portfolio: { fr: "Portfolio immersif", en: "Immersive portfolio" },
} satisfies Record<string, Record<Locale, string>>;

type ProjectSlug = keyof typeof projects;

type SampleSkill = Omit<ConstellationSkill, "label" | "relatedProjects"> & { label: Record<Locale, string>; projects: ProjectSlug[] };

const sample: SampleSkill[] = [
  { id: "llm", label: { fr: "LLM", en: "LLMs" }, group: "ai", weight: 5, projects: ["nami", "payfit", "mirakl"] },
  { id: "rag", label: { fr: "RAG", en: "RAG" }, group: "ai", weight: 4, projects: ["payfit", "mirakl"] },
  { id: "agents", label: { fr: "Agents IA", en: "AI agents" }, group: "ai", weight: 5, projects: ["nami", "payfit"] },
  { id: "computer-use", label: { fr: "Computer-use agents", en: "Computer-use agents" }, group: "ai", weight: 4, projects: ["nami"] },
  { id: "prompting", label: { fr: "Prompt engineering", en: "Prompt engineering" }, group: "ai", weight: 4, projects: ["nami", "payfit", "mirakl", "elevate"] },
  { id: "dust", label: { fr: "Dust", en: "Dust" }, group: "ai", weight: 3, projects: ["payfit"] },
  { id: "openai", label: { fr: "OpenAI API", en: "OpenAI API" }, group: "ai", weight: 4, projects: ["nami", "mirakl"] },
  { id: "n8n", label: { fr: "n8n", en: "n8n" }, group: "build", weight: 3, projects: ["elevate"] },
  { id: "make", label: { fr: "Make", en: "Make" }, group: "build", weight: 2, projects: ["elevate"] },
  { id: "nextjs", label: { fr: "Next.js", en: "Next.js" }, group: "build", weight: 4, projects: ["nami", "portfolio"] },
  { id: "react", label: { fr: "React", en: "React" }, group: "build", weight: 4, projects: ["nami", "payfit", "portfolio"] },
  { id: "typescript", label: { fr: "TypeScript", en: "TypeScript" }, group: "build", weight: 3, projects: ["nami", "portfolio"] },
  { id: "supabase", label: { fr: "Supabase", en: "Supabase" }, group: "build", weight: 3, projects: ["mirakl"] },
  { id: "vercel", label: { fr: "Vercel", en: "Vercel" }, group: "build", weight: 3, projects: ["payfit", "portfolio"] },
  { id: "python", label: { fr: "Python", en: "Python" }, group: "build", weight: 3, projects: ["mirakl"] },
  { id: "needs", label: { fr: "Recueil des besoins", en: "Requirements gathering" }, group: "business", weight: 4, projects: ["essec", "elevate"] },
  { id: "migration", label: { fr: "Reprise de données", en: "Data migration" }, group: "business", weight: 3, projects: ["essec"] },
  { id: "dashboards", label: { fr: "Dashboards", en: "Dashboards" }, group: "business", weight: 3, projects: ["mirakl", "essec"] },
  { id: "access", label: { fr: "Gestion des droits", en: "Access management" }, group: "business", weight: 2, projects: ["essec"] },
  { id: "user-tests", label: { fr: "Tests utilisateurs", en: "User testing" }, group: "business", weight: 3, projects: ["nami", "elevate"] },
];

const copy: Record<Locale, { eyebrow: string; title: string; lead: string; labels: ConstellationLabels }> = {
  fr: {
    eyebrow: "Lab · Constellation",
    title: "Mes compétences, en orbite autour de l'IA.",
    lead: "Prototype de la constellation 3D : chaque étoile est une compétence, chaque lien un projet partagé. Survolez, touchez ou utilisez Tab pour explorer.",
    labels: {
      groups: { ai: "IA", build: "Build", business: "Business" },
      relatedProjects: "Projets liés",
      hint: "Survolez ou touchez une étoile pour découvrir une compétence et les projets où je l'ai mise en pratique.",
    },
  },
  en: {
    eyebrow: "Lab · Constellation",
    title: "My skills, orbiting around AI.",
    lead: "Prototype of the 3D constellation: every star is a skill, every link a shared project. Hover, tap or use Tab to explore.",
    labels: {
      groups: { ai: "AI", build: "Build", business: "Business" },
      relatedProjects: "Related projects",
      hint: "Hover or tap a star to discover a skill and the projects where I put it into practice.",
    },
  },
};

export default async function ConstellationLab() {
  const lang = await getLocale();
  const t = copy[lang];
  const skills: ConstellationSkill[] = sample.map(({ label, projects: slugs, ...rest }) => ({
    ...rest,
    label: label[lang],
    relatedProjects: slugs.map((slug) => ({ slug, title: projects[slug][lang] })),
  }));

  return (
    <>
      <main className="pt-28">
        <Section index="05" eyebrow={t.eyebrow} title={t.title}>
          <p className="-mt-6 mb-14 max-w-2xl text-lead text-ink-soft md:-mt-10 md:mb-20">{t.lead}</p>
          <SkillsConstellationLazy skills={skills} labels={t.labels} projectBasePath={`/${lang}/projets`} />
        </Section>
      </main>
      <Footer />
    </>
  );
}
