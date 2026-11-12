import type { Localized } from "./types";

export type SkillGroup = "ai" | "build" | "business";

export type SkillId =
  | "llm"
  | "rag"
  | "agents-ia"
  | "computer-use"
  | "prompt-engineering"
  | "dust"
  | "openai-api"
  | "n8n-make"
  | "nextjs"
  | "react"
  | "supabase"
  | "vercel"
  | "python"
  | "recueil-besoins"
  | "reprise-donnees"
  | "gestion-droits"
  | "tests-utilisateurs"
  | "dashboards";

export type Skill = {
  id: SkillId;
  group: SkillGroup;
  label: Localized;
  description: Localized;
  /** Slugs from `projects.ts` where this skill was used. */
  relatedProjects: string[];
};

export const skillGroups: { id: SkillGroup; label: Localized }[] = [
  { id: "ai", label: { fr: "Intelligence artificielle", en: "Artificial intelligence" } },
  { id: "build", label: { fr: "Construire", en: "Build" } },
  { id: "business", label: { fr: "Métier", en: "Business" } },
];

export const skills: Skill[] = [
  {
    id: "llm",
    group: "ai",
    label: { fr: "LLM", en: "LLM" },
    description: {
      fr: "Génération et extraction structurées, revalidées dans le code.",
      en: "Structured generation and extraction, re-validated in code.",
    },
    relatedProjects: ["brasserie-de-tahiti", "nami", "hackathon-payfit", "hackathon-mirakl", "ecrire-son-livre", "bizroast"],
  },
  {
    id: "rag",
    group: "ai",
    label: { fr: "RAG", en: "RAG" },
    description: {
      fr: "Recherche documentaire (RAG) sur plus de 16 000 pages à la Brasserie de Tahiti.",
      en: "Retrieval-augmented search (RAG) over 16,000+ documentation pages at Brasserie de Tahiti.",
    },
    relatedProjects: ["brasserie-de-tahiti", "hackathon-essec"],
  },
  {
    id: "agents-ia",
    group: "ai",
    label: { fr: "Agents IA", en: "AI agents" },
    description: {
      fr: "Agents outillés, garde-fous dans le code, arrêt par construction.",
      en: "Tool-using agents, guardrails in code, stop by design.",
    },
    relatedProjects: ["nami", "hackathon-payfit", "hackathon-essec", "hackathon-mirakl"],
  },
  {
    id: "computer-use",
    group: "ai",
    label: { fr: "Computer use", en: "Computer use" },
    description: {
      fr: "Un agent H qui pilote un Chrome visible pour remplir des formulaires officiels.",
      en: "An H agent driving a visible Chrome to fill official forms.",
    },
    relatedProjects: ["nami"],
  },
  {
    id: "prompt-engineering",
    group: "ai",
    label: { fr: "Conception de consignes", en: "Prompt engineering" },
    description: {
      fr: "Consignes, conditions d'arrêt, listes noires, contenu non fiable.",
      en: "Instructions, stop conditions, blocklists, untrusted content.",
    },
    relatedProjects: ["nami", "hackathon-payfit", "ecrire-son-livre", "bizroast"],
  },
  {
    id: "dust",
    group: "ai",
    label: { fr: "Dust", en: "Dust" },
    description: {
      fr: "Agents orchestrés pour la rédaction paie et RH (1er prix PayFit).",
      en: "Orchestrated agents for payroll and HR writing (1st prize PayFit).",
    },
    relatedProjects: ["hackathon-payfit"],
  },
  {
    id: "openai-api",
    group: "ai",
    label: { fr: "API OpenAI", en: "OpenAI API" },
    description: {
      fr: "Génération de messages, assistant RAG, agents d'enquête.",
      en: "Message generation, RAG assistant, investigation agents.",
    },
    relatedProjects: ["hackathon-mirakl", "hackathon-essec"],
  },
  {
    id: "n8n-make",
    group: "ai",
    label: { fr: "n8n / Make", en: "n8n / Make" },
    description: {
      fr: "Automatisations reliant collecte, IA, e-mails et notifications.",
      en: "Automations linking collection, AI, e-mails and notifications.",
    },
    relatedProjects: ["hackathon-mirakl", "auralife"],
  },
  {
    id: "nextjs",
    group: "build",
    label: { fr: "Next.js", en: "Next.js" },
    description: {
      fr: "App Router, routes API, serveur sans état.",
      en: "App Router, API routes, stateless server.",
    },
    relatedProjects: ["nami", "hackathon-essec"],
  },
  {
    id: "react",
    group: "build",
    label: { fr: "React", en: "React" },
    description: {
      fr: "Interfaces, panneaux, tableaux de bord.",
      en: "Interfaces, panels, dashboards.",
    },
    relatedProjects: ["hackathon-payfit", "nami", "eugeniagram"],
  },
  {
    id: "supabase",
    group: "build",
    label: { fr: "Supabase", en: "Supabase" },
    description: {
      fr: "Schémas, règles de sécurité, imports multi-sources.",
      en: "Schemas, security rules, multi-source imports.",
    },
    relatedProjects: ["ping-pang", "hackathon-essec"],
  },
  {
    id: "vercel",
    group: "build",
    label: { fr: "Vercel", en: "Vercel" },
    description: {
      fr: "Démos déployées pendant les hackathons.",
      en: "Demos deployed during hackathons.",
    },
    relatedProjects: ["hackathon-payfit", "hackathon-mirakl"],
  },
  {
    id: "python",
    group: "build",
    label: { fr: "Python", en: "Python" },
    description: {
      fr: "Services de défense, pipelines et scripts.",
      en: "Defence services, pipelines and scripts.",
    },
    relatedProjects: ["hackathon-essec"],
  },
  {
    id: "recueil-besoins",
    group: "business",
    label: { fr: "Recueil des besoins", en: "Requirements gathering" },
    description: {
      fr: "Comprendre le processus réel avant de dessiner l'interface.",
      en: "Understand the real process before designing the interface.",
    },
    relatedProjects: ["brasserie-de-tahiti", "ar-plate", "auralife"],
  },
  {
    id: "reprise-donnees",
    group: "business",
    label: { fr: "Reprise de données", en: "Data migration" },
    description: {
      fr: "22 000 entrées et dix ans d'historique repris, environ 400 anomalies détectées.",
      en: "22,000 entries and ten years of history migrated, around 400 anomalies detected.",
    },
    relatedProjects: ["brasserie-de-tahiti", "ping-pang"],
  },
  {
    id: "gestion-droits",
    group: "business",
    label: { fr: "Gestion des droits", en: "Access management" },
    description: {
      fr: "Rôles, statuts et règles d'accès pensés avec le modèle de données.",
      en: "Roles, statuses and access rules designed with the data model.",
    },
    relatedProjects: ["brasserie-de-tahiti", "ping-pang"],
  },
  {
    id: "tests-utilisateurs",
    group: "business",
    label: { fr: "Tests utilisateurs", en: "User testing" },
    description: {
      fr: "Tester les droits et les cas limites avec les équipes concernées.",
      en: "Test permissions and edge cases with the teams involved.",
    },
    relatedProjects: ["brasserie-de-tahiti", "ar-plate"],
  },
  {
    id: "dashboards",
    group: "business",
    label: { fr: "Tableaux de bord", en: "Dashboards" },
    description: {
      fr: "19 tableaux de bord livrés, données ouvertes analysées.",
      en: "19 dashboards delivered, open data analysed.",
    },
    relatedProjects: ["brasserie-de-tahiti", "hackathon-mirakl", "analyse-accidentologie"],
  },
];

export const getSkill = (id: SkillId): Skill | undefined => skills.find((s) => s.id === id);
