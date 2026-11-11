import type { Localized } from "./types";

export type JourneyStep = {
  id: string;
  year: Localized;
  place: Localized;
  title: Localized;
  text: Localized;
  /** The open, future step (gets a CTA). */
  open?: boolean;
};

export const journey: JourneyStep[] = [
  {
    id: "annecy",
    year: { fr: "Origines", en: "Origins" },
    place: { fr: "Annecy, Haute-Savoie", en: "Annecy, French Alps" },
    title: { fr: "Grandir entre lac et montagnes", en: "Growing up between lake and mountains" },
    text: {
      fr: "Un environnement très sportif : rugby, football, VTT, randonnée, musculation, course et trail. Le goût de l'effort et des objectifs clairs vient de là.",
      en: "A very sporty upbringing: rugby, football, mountain biking, hiking, weight training, running and trail. The taste for effort and clear goals comes from there.",
    },
  },
  {
    id: "eugenia",
    year: { fr: "2025", en: "2025" },
    place: { fr: "Eugenia School, Paris", en: "Eugenia School, Paris" },
    title: { fr: "Bachelor IA, Data & Business", en: "Bachelor in AI, Data & Business" },
    text: {
      fr: "Départ pour Paris et un cursus hybride : développement, données et compréhension des enjeux de l'entreprise. Premiers projets : Eugeniagram, Analyse Accidentologie, Ping Pang.",
      en: "Moving to Paris for a hybrid curriculum: development, data and an understanding of business stakes. First projects: Eugeniagram, Analyse Accidentologie, Ping Pang.",
    },
  },
  {
    id: "tahiti",
    year: { fr: "2026", en: "2026" },
    place: { fr: "Brasserie de Tahiti, Polynésie française", en: "Brasserie de Tahiti, French Polynesia" },
    title: { fr: "Stage : cinq applications métiers en huit semaines", en: "Internship: five business apps in eight weeks" },
    text: {
      fr: "Recueil des besoins, modélisation, développement et tests utilisateurs. RAG sur plus de 16 000 pages, 19 tableaux de bord, 22 000 entrées reprises, extraction IA de contrats PDF.",
      en: "Requirements gathering, data modelling, development and user testing. RAG over 16,000+ pages, 19 dashboards, 22,000 entries migrated, AI extraction of PDF contracts.",
    },
  },
  {
    id: "hackathons",
    year: { fr: "2026", en: "2026" },
    place: { fr: "Eugenia School, Paris", en: "Eugenia School, Paris" },
    title: { fr: "Retour à Paris : hackathons et agents IA", en: "Back in Paris: hackathons and AI agents" },
    text: {
      fr: "Deuxième année. 1er prix PayFit, 1er sur le cas d'usage Mirakl, chef de projet au hackathon ESSEC, puis Nami au hackathon H Company × 42AI sur les agents computer use.",
      en: "Second year. 1st prize PayFit, 1st on the Mirakl use case, project lead at the ESSEC hackathon, then Nami at the H Company × 42AI hackathon on computer-use agents.",
    },
  },
  {
    id: "alternance",
    year: { fr: "Septembre 2027", en: "September 2027" },
    place: { fr: "À définir ensemble", en: "To be defined together" },
    title: { fr: "Alternance IA", en: "AI apprenticeship" },
    text: {
      fr: "La prochaine étape : rejoindre une équipe qui met l'IA au service de vrais besoins métier, et continuer à livrer des outils utilisés au quotidien.",
      en: "The next step: joining a team that puts AI to work on real business needs, and keep shipping tools people use every day.",
    },
    open: true,
  },
];
