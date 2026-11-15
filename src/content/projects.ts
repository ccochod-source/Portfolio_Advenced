import type { SkillId } from "./skills";
import type { Localized } from "./types";

export type ProjectImage = { src: string; alt: Localized; width: number; height: number };
export type CinematicCover = { src: string; width: number; height: number };
export type ProjectLink = { label: Localized; href: string; kind: "github" | "demo" | "video" | "data" };

export type Project = {
  slug: string;
  title: string;
  category: Localized;
  year: string;
  summary: Localized;
  award?: Localized;
  featured: boolean;
  /** Tech tags, language-neutral. */
  tags: string[];
  skills: SkillId[];
  role: Localized;
  /** Two or three words for the Selected Work meta column (featured projects). */
  roleShort?: Localized;
  context: Localized;
  approach: Localized[];
  results: Localized[];
  cinematic?: CinematicCover;
  images: ProjectImage[];
  links?: ProjectLink[];
};

export function projectCover(p: Project) {
  return p.cinematic ?? p.images[0];
}

export const projects: Project[] = [
  {
    slug: "brasserie-de-tahiti",
    title: "Brasserie de Tahiti",
    category: { fr: "Stage · 5 applications métiers", en: "Internship · 5 business apps" },
    year: "2026",
    featured: true,
    summary: {
      fr: "Huit semaines pour livrer cinq outils métiers : RAG sur plus de 16 000 pages, 19 tableaux de bord, extraction IA de contrats PDF et 22 000 entrées reprises.",
      en: "Eight weeks to ship five business tools: RAG over 16,000+ pages, 19 dashboards, AI extraction of PDF contracts and 22,000 entries migrated.",
    },
    tags: ["RAG", "LLM", "BI", "Dashboards", "ITSM", "Excel → App"],
    skills: ["rag", "llm", "recueil-besoins", "reprise-donnees", "gestion-droits", "tests-utilisateurs", "dashboards"],
    roleShort: { fr: "Développeur applications & IA", en: "Apps & AI developer" },
    role: {
      fr: "Stagiaire développeur d'applications métiers : recueil des besoins, modélisation des données, développement, reprise des historiques, gestion des droits, contrôles de cohérence, tests utilisateurs et préparation du déploiement.",
      en: "Business-application developer intern: requirements gathering, data modelling, development, legacy data migration, access management, consistency checks, user testing and deployment preparation.",
    },
    context: {
      fr: "Les équipes travaillaient avec des sources hétérogènes : documents internes, historiques Excel, données financières et procédures terrain. Chaque application devait respecter les rôles métier, reprendre l'existant et rester compréhensible par des utilisateurs non techniques.",
      en: "Teams worked with heterogeneous sources: internal documents, Excel histories, financial data and field procedures. Each application had to respect business roles, migrate the existing data and stay understandable for non-technical users.",
    },
    approach: [
      {
        fr: "Data Hub & Omni : couche sémantique, environ 50 corrections de modèles, 19 tableaux de bord et recherche RAG sur plus de 16 000 pages documentaires.",
        en: "Data Hub & Omni: semantic layer, around 50 model fixes, 19 dashboards and RAG search over 16,000+ pages of documentation.",
      },
      {
        fr: "GestioPro : gestion des investissements avec 9 statuts, 7 rôles, budgets multi-devises, plus de 200 contrôles et une dizaine d'exports.",
        en: "GestioPro: investment management with 9 statuses, 7 roles, multi-currency budgets, 200+ checks and about ten exports.",
      },
      {
        fr: "Flotte & carburant : 26 feuilles Excel remplacées, 150 véhicules suivis, dix ans d'historique repris dont 22 000 entrées carburant, environ 400 anomalies détectées.",
        en: "Fleet & fuel: 26 Excel sheets replaced, 150 vehicles tracked, ten years of history migrated including 22,000 fuel entries, around 400 anomalies detected.",
      },
      {
        fr: "HSE : six types de permis de travail et 17 formulaires dynamiques adaptés aux opérations terrain.",
        en: "HSE: six types of work permits and 17 dynamic forms adapted to field operations.",
      },
      {
        fr: "Pilotage DSI : intégration ITSM, extraction assistée par IA des contrats PDF et espace de documentation interne.",
        en: "IT management: ITSM integration, AI-assisted extraction of PDF contracts and an internal documentation space.",
      },
    ],
    results: [
      { fr: "5 applications livrées en 8 semaines", en: "5 applications shipped in 8 weeks" },
      { fr: "Recherche RAG sur plus de 16 000 pages", en: "RAG search over 16,000+ pages" },
      { fr: "19 tableaux de bord, environ 50 corrections de modèles", en: "19 dashboards, around 50 model fixes" },
      { fr: "22 000 entrées reprises, environ 400 anomalies détectées", en: "22,000 entries migrated, around 400 anomalies detected" },
      { fr: "26 feuilles Excel remplacées, 150 véhicules suivis", en: "26 Excel sheets replaced, 150 vehicles tracked" },
      { fr: "Plus de 200 contrôles, 7 rôles, 9 statuts, 17 formulaires dynamiques", en: "200+ checks, 7 roles, 9 statuses, 17 dynamic forms" },
    ],
    images: [
      {
        src: "/projects/brasserie-de-tahiti/cover.webp",
        alt: { fr: "Maquette d'un tableau de bord Brasserie de Tahiti : pages indexées, tableaux de bord, entrées reprises", en: "Mock-up of a Brasserie de Tahiti dashboard: indexed pages, dashboards, migrated entries" },
        width: 1600,
        height: 1000,
      },
      {
        src: "/projects/brasserie-de-tahiti/logo.webp",
        alt: { fr: "Logo de la Brasserie de Tahiti", en: "Brasserie de Tahiti logo" },
        width: 894,
        height: 630,
      },
    ],
  },
  {
    slug: "nami",
    title: "Nami",
    category: { fr: "Hackathon H Company × 42AI · Agent computer use", en: "H Company × 42AI hackathon · Computer-use agent" },
    year: "2026",
    featured: true,
    summary: {
      fr: "Un agent de voyage vocal qui remplit les formulaires officiels dans un Chrome visible et s'arrête toujours avant le paiement. Construit en 36 heures, Paris, 7 et 8 novembre 2026.",
      en: "A voice travel agent that fills official forms in a visible Chrome and always stops before payment. Built in 36 hours, Paris, 7–8 November 2026.",
    },
    tags: ["Next.js 16", "React 19", "TypeScript", "H Agents API", "CDP", "Gladia", "Linkup", "zod", "vitest"],
    skills: ["computer-use", "agents-ia", "prompt-engineering", "llm", "nextjs", "react"],
    roleShort: { fr: "Lead agent computer use", en: "Computer-use agent lead" },
    role: {
      fr: "Responsable de l'agent H (computer use) dans une équipe de quatre : création et suivi des sessions, consignes et conditions d'arrêt, pont vers le navigateur local, module Vol et banc de démo sur mon Mac.",
      en: "Owner of the H (computer-use) agent in a team of four: session creation and tracking, instructions and stop conditions, bridge to the local browser, Flight module and the demo bench on my Mac.",
    },
    context: {
      fr: "Un voyage lointain, c'est surtout des papiers : pour Bali, un visa électronique, une carte d'arrivée et une taxe touristique sur trois sites officiels, entourés de sites miroirs qui font payer des formulaires gratuits. Le hackathon H Company × 42AI portait sur les agents « computer use » : des IA qui observent un écran et agissent par clics et saisies.",
      en: "A long-haul trip is mostly paperwork: for Bali, an e-visa, an arrival card and a tourist tax on three official websites, surrounded by copycat sites charging for free forms. The H Company × 42AI hackathon focused on computer-use agents: AIs that observe a screen and act through clicks and typing.",
    },
    approach: [
      {
        fr: "L'utilisateur parle comme à un concierge. Nami comprend la demande, déduit les papiers nécessaires, retrouve le passeport sur l'ordinateur et le lit avec un modèle de vision, MRZ vérifiée.",
        en: "The user talks to Nami like a concierge. Nami understands the request, infers the required papers, finds the passport on the computer and reads it with a vision model, MRZ verified.",
      },
      {
        fr: "Un agent H pilote un Chrome dédié par le port de débogage (CDP) : il remplit le visa e-VOA puis la carte d'arrivée, et cherche un vol réel sur Google Flights. Le dépôt de fichiers et les menus fragiles passent par des outils personnalisés servis par Nami.",
        en: "An H agent drives a dedicated Chrome through the debug port (CDP): it fills the e-VOA visa then the arrival card, and looks up a real flight on Google Flights. File uploads and fragile menus go through custom tools served by Nami.",
      },
      {
        fr: "Les garde-fous sont dans le code, pas dans la bonne volonté de l'agent : domaine officiel obligatoire, boutons interdits (Submit, Pay, Sign in…), contenu des pages traité comme non fiable, arrêt par construction avant tout envoi ou paiement.",
        en: "Guardrails live in code, not in the agent's goodwill: official domain only, forbidden buttons (Submit, Pay, Sign in…), page content treated as untrusted, stop by design before any submission or payment.",
      },
      {
        fr: "Robustesse quand l'API H ralentit : réessai, relance automatique d'une session muette au bout de 45 s, libération locale du navigateur, repli de modèle. Chaque correction rejouée en réel avec des scripts.",
        en: "Robustness when the H API slows down: retry, automatic restart of a silent session after 45 s, local browser release, model fallback. Every fix replayed for real with scripts.",
      },
    ],
    results: [
      { fr: "Visa e-VOA : menus, passeport et photo déposés, arrêt à l'étape 1 sans clic humain (60 à 125 s)", en: "e-VOA visa: menus, passport and photo uploaded, stopped at step 1 with no human click (60 to 125 s)" },
      { fr: "Carte d'arrivée remplie, arrêt avant Submit ; vols réels lus en 13 s, page de réservation en 27 s", en: "Arrival card filled, stopped before Submit; real flights read in 13 s, booking page reached in 27 s" },
      { fr: "Environ 0,09 $ par session de visa", en: "Around $0.09 per visa session" },
      { fr: "Équipe : ~117 PR fusionnées, 1 018 tests vitest, lint et build verts au rendu", en: "Team: ~117 merged PRs, 1,018 vitest tests, lint and build green at submission" },
      { fr: "Parcours complet à la voix démontré sur mon Mac la nuit du 7 au 8 novembre", en: "Full voice journey demonstrated on my Mac on the night of 7–8 November" },
    ],
    images: [
      {
        src: "/projects/nami/cover.webp",
        alt: { fr: "Porte balinaise face à la mer au lever du soleil, fond du panneau Nami", en: "Balinese gate facing the sea at sunrise, background of the Nami panel" },
        width: 900,
        height: 1598,
      },
    ],
    links: [{ label: { fr: "Code sur GitHub", en: "Code on GitHub" }, href: "https://github.com/llecalvez-dotcom/nami", kind: "github" }],
  },
  {
    slug: "hackathon-payfit",
    title: "Hackathon PayFit",
    category: { fr: "Hackathon · Rédaction assistée paie & RH", en: "Hackathon · AI-assisted payroll & HR writing" },
    year: "2026",
    featured: true,
    award: { fr: "1er prix · Hackathon PayFit", en: "1st prize · PayFit hackathon" },
    summary: {
      fr: "Une plateforme de rédaction assistée pour la paie et les RH : agents Dust (EEAT, SEO, garde-fous juridiques), interface React, démo sur Vercel. 1er prix en équipe.",
      en: "An assisted-writing platform for payroll and HR: Dust agents (EEAT, SEO, legal guardrails), React interface, demo on Vercel. 1st prize as a team.",
    },
    tags: ["Dust", "React", "Vercel", "LLM", "SEO", "MCP"],
    skills: ["dust", "agents-ia", "prompt-engineering", "llm", "react", "vercel"],
    roleShort: { fr: "Agents IA & démo produit", en: "AI agents & product demo" },
    role: {
      fr: "Conception des parcours d'agents et des consignes, intégration par API, structuration de la démo produit et narration de la valeur : qualité et vitesse face à la rédaction manuelle.",
      en: "Design of the agent flows and instructions, API integration, structure of the product demo and value narrative: quality and speed versus manual writing.",
    },
    context: {
      fr: "Hackathon organisé avec PayFit : produire des articles sérieux sur la paie et les RH, un domaine où le fond juridique est sensible et où le référencement exige structure, cohérence et sources plutôt que du texte générique.",
      en: "Hackathon organised with PayFit: produce serious articles on payroll and HR, a field where legal content is sensitive and where search ranking demands structure, consistency and sources rather than generic text.",
    },
    approach: [
      {
        fr: "Des agents orchestrés sur Dust se répartissent les rôles : un agent créateur rédige un article structuré de 800 à 1 500 mots à partir d'un brief, un agent législatif vérifie la conformité au droit du travail français et liste les corrections, un agent EEAT contrôle expertise et sources.",
        en: "Agents orchestrated on Dust share the work: a creator agent writes a structured 800–1,500-word article from a brief, a legal agent checks compliance with French labour law and lists corrections, an EEAT agent reviews expertise and sources.",
      },
      {
        fr: "Génération et contrôle restent des étapes distinctes : un humain relit avant toute mise en ligne.",
        en: "Generation and review stay separate steps: a human reads before anything goes live.",
      },
      {
        fr: "Interface React pour la recherche et la génération, déploiement d'une démo sur Vercel, deck de soutenance.",
        en: "React interface for search and generation, demo deployed on Vercel, pitch deck.",
      },
    ],
    results: [
      { fr: "1er prix du hackathon, en équipe", en: "1st prize of the hackathon, as a team" },
      { fr: "Démonstration fonctionnelle lors de la soutenance", en: "Working demo during the final pitch" },
      { fr: "Articles structurés, relisibles par un humain avant publication", en: "Structured articles, reviewable by a human before publication" },
    ],
    images: [
      {
        src: "/projects/hackathon-payfit/cover.webp",
        alt: { fr: "Première diapositive de la soutenance PayFit", en: "First slide of the PayFit pitch" },
        width: 1024,
        height: 579,
      },
      {
        src: "/projects/hackathon-payfit/agent-legislatif.webp",
        alt: { fr: "Diapositive présentant l'agent législatif", en: "Slide presenting the legal agent" },
        width: 1600,
        height: 900,
      },
      {
        src: "/projects/hackathon-payfit/agent-createur.webp",
        alt: { fr: "Diapositive présentant l'agent créateur", en: "Slide presenting the creator agent" },
        width: 1600,
        height: 900,
      },
    ],
    links: [{ label: { fr: "Voir la démo", en: "See the demo" }, href: "https://payfit-pied.vercel.app", kind: "demo" }],
  },
  {
    slug: "hackathon-mirakl",
    title: "Hackathon Mirakl",
    category: { fr: "Hackathon · Prospection automatisée par IA", en: "Hackathon · AI-automated prospecting" },
    year: "2026",
    featured: true,
    award: { fr: "1er du cas d'usage · Hackathon Mirakl", en: "1st in the use-case track · Mirakl hackathon" },
    summary: {
      fr: "Une chaîne complète de prospection : collecte, enrichissement des prospects, e-mails personnalisés par IA générative et suivi des campagnes. 1er sur le cas d'usage, 2e au général.",
      en: "An end-to-end prospecting pipeline: collection, lead enrichment, AI-generated personalised e-mails and campaign tracking. 1st on the use case, 2nd overall.",
    },
    tags: ["n8n", "OpenAI API", "Brevo", "Slack", "Scraping", "Vercel"],
    skills: ["llm", "agents-ia", "openai-api", "n8n-make", "vercel", "dashboards"],
    roleShort: { fr: "Pipeline data → IA", en: "Data → AI pipeline" },
    role: {
      fr: "Co-conception en équipe du pipeline données → texte, de la démo et du récit pour le jury, côté métier comme côté technique.",
      en: "Co-design, as a team, of the data → text pipeline, the demo and the story for the jury, on both the business and technical sides.",
    },
    context: {
      fr: "Hackathon Eugenia School autour d'un défi Mirakl : industrialiser une prospection sortante sans sacrifier la personnalisation, à partir de données accessibles et d'IA générative.",
      en: "Eugenia School hackathon around a Mirakl challenge: scale outbound prospecting without sacrificing personalisation, using accessible data and generative AI.",
    },
    approach: [
      {
        fr: "Collecte et nettoyage des signaux, enrichissement des prospects, puis génération de plusieurs variantes d'e-mails par l'IA à partir du contexte vendeur et marketplace, dans des workflows n8n.",
        en: "Collect and clean signals, enrich leads, then let the AI generate several e-mail variants from the seller and marketplace context, inside n8n workflows.",
      },
      {
        fr: "Suivi des campagnes relié aux événements Brevo (ouvertures, clics, réponses, échecs) avec notification Slack dès qu'un prospect se montre intéressé.",
        en: "Campaign tracking wired to Brevo events (opens, clicks, replies, bounces) with a Slack notification as soon as a lead shows interest.",
      },
      {
        fr: "Un tableau de bord de campagnes déployé sur Vercel et un pitch pour raconter le produit : une démo cliquable, pas seulement un script.",
        en: "A campaign dashboard deployed on Vercel and a pitch to tell the product story: a clickable demo, not just a script.",
      },
    ],
    results: [
      { fr: "1er sur le cas d'usage, 2e au classement général", en: "1st on the use case, 2nd overall" },
      { fr: "Accès API OpenAI d'une valeur annoncée de 5 000 €", en: "OpenAI API access with an announced value of €5,000" },
      { fr: "Tableau de bord en ligne et workflows de bout en bout", en: "Live dashboard and end-to-end workflows" },
    ],
    images: [
      {
        src: "/projects/hackathon-mirakl/cover.webp",
        alt: { fr: "Illustration : vendeur, marketplace et message personnalisé reliés par l'IA", en: "Illustration: seller, marketplace and personalised message linked by AI" },
        width: 1600,
        height: 900,
      },
      {
        src: "/projects/hackathon-mirakl/workflow-emails.webp",
        alt: { fr: "Workflow n8n de génération d'e-mails : chargement du contexte, préparation IA, enregistrement et mise à jour du statut", en: "n8n e-mail generation workflow: context loading, AI preparation, saving and status update" },
        width: 1600,
        height: 640,
      },
      {
        src: "/projects/hackathon-mirakl/workflow-suivi.webp",
        alt: { fr: "Workflow n8n de suivi Brevo : réception des événements, mise à jour du prospect et notification Slack", en: "n8n Brevo tracking workflow: event reception, lead update and Slack notification" },
        width: 1600,
        height: 584,
      },
    ],
    links: [{ label: { fr: "Voir le tableau de bord", en: "See the dashboard" }, href: "https://mirakl.vercel.app", kind: "demo" }],
  },
  {
    slug: "ecrire-son-livre",
    title: "Écrire son livre",
    category: { fr: "Application client · IA éditoriale", en: "Client app · Editorial AI" },
    year: "2026",
    featured: false,
    summary: {
      fr: "Une application privée qui transforme des idées racontées à l'oral en manuscrit structuré : transcription, vérification factuelle, assistant contextualisé et export Word.",
      en: "A private app that turns spoken ideas into a structured manuscript: transcription, fact-checking, context-aware assistant and Word export.",
    },
    tags: ["Speech-to-text", "LLM", "DOCX"],
    skills: ["llm", "prompt-engineering"],
    role: {
      fr: "Conception du parcours d'écriture, structuration des données du manuscrit, intégration des fonctions d'IA, développement de l'interface privée et génération de l'export DOCX. Projet mené avec Cochod Elevate.",
      en: "Design of the writing flow, structure of the manuscript data, integration of the AI features, development of the private interface and DOCX export. Delivered through Cochod Elevate.",
    },
    context: {
      fr: "L'écriture longue est freinée par la page blanche, la dispersion des notes et le temps nécessaire pour reprendre chaque passage. Le projet devait faciliter la production sans uniformiser la voix de l'autrice.",
      en: "Long-form writing is slowed by the blank page, scattered notes and the time needed to rework each passage. The project had to ease production without flattening the author's voice.",
    },
    approach: [
      {
        fr: "Le parcours commence par l'enregistrement audio et la transcription, dans le même espace.",
        en: "The flow starts with audio recording and transcription, in the same workspace.",
      },
      {
        fr: "Les contenus sont ensuite organisés progressivement dans le manuscrit, corrigés et retravaillés. Correction et vérification factuelle restent des étapes séparées.",
        en: "Content is then progressively organised into the manuscript, corrected and reworked. Proofreading and fact-checking stay separate steps.",
      },
      {
        fr: "Un assistant conserve le contexte du livre pour répondre sans tout réexpliquer ; un export Word permet de poursuivre hors de l'outil.",
        en: "An assistant keeps the book's context to answer without re-explaining everything; a Word export lets the author continue outside the tool.",
      },
    ],
    results: [
      { fr: "Un espace unique qui relie parole, transcription, édition et export", en: "A single space linking speech, transcription, editing and export" },
      { fr: "Le premier résultat de l'IA n'est jamais présenté comme un texte définitif", en: "The AI's first draft is never presented as final text" },
      { fr: "Export DOCX exploitable", en: "Usable DOCX export" },
    ],
    images: [
      {
        src: "/projects/ecrire-son-livre/cover.webp",
        alt: { fr: "Visuel éditorial : un livre ouvert, un micro et une onde sonore", en: "Editorial visual: an open book, a microphone and a sound wave" },
        width: 1600,
        height: 900,
      },
    ],
  },
  {
    slug: "hackathon-essec",
    title: "Secure Horizons",
    category: { fr: "Hackathon ESSEC · Sécurité des agents IA", en: "ESSEC hackathon · AI-agent security" },
    year: "2026",
    featured: false,
    summary: {
      fr: "36 heures sur la sécurité des agents IA et le contrôle humain, avec des mentors KPMG : un copilote SOC pour enquêter sur les incidents impliquant des agents compromis.",
      en: "36 hours on AI-agent security and human oversight, with KPMG mentors: a SOC copilot to investigate incidents involving compromised agents.",
    },
    tags: ["Python", "Next.js", "Supabase", "PostgreSQL", "OpenAI API", "RAG"],
    skills: ["agents-ia", "rag", "openai-api", "python", "nextjs", "supabase"],
    role: {
      fr: "Chef de projet : répartition du travail, cadrage du parcours, arbitrages pendant 36 heures et restitution devant les mentors KPMG.",
      en: "Project lead: task allocation, scoping of the user journey, trade-offs over 36 hours and presentation to the KPMG mentors.",
    },
    context: {
      fr: "Hackathon ESSEC Secure Horizons : comment garder la main sur des agents IA qui exécutent des outils, et enquêter quand l'un d'eux est compromis ?",
      en: "ESSEC Secure Horizons hackathon: how to keep control over AI agents that run tools, and investigate when one is compromised?",
    },
    approach: [
      {
        fr: "Une interface d'enquête (TRACE) reliée à un assistant RAG sur Supabase et à un pipeline de défense en Python.",
        en: "An investigation interface (TRACE) wired to a RAG assistant on Supabase and a Python defence pipeline.",
      },
      {
        fr: "Une passerelle qui trace les conversations des agents, un coffre, des leurres et un contrôle des paquets installés ; les suspensions d'outils sont appliquées après approbation humaine.",
        en: "A gateway that traces agent conversations, a vault, decoys and an audit of installed packages; tool suspensions are applied after human approval.",
      },
    ],
    results: [
      { fr: "Prototype de bout en bout : question → RAG → traces → incidents → confinement", en: "End-to-end prototype: question → RAG → traces → incidents → containment" },
      { fr: "Tests Python et build front-end au vert", en: "Python tests passing, front-end build green" },
    ],
    images: [
      {
        src: "/projects/hackathon-essec/cover.webp",
        alt: { fr: "Maquette de l'interface TRACE : centre de contrôle, enquête et agents", en: "Mock-up of the TRACE interface: control centre, investigation and agents" },
        width: 1536,
        height: 1024,
      },
    ],
    links: [{ label: { fr: "Code sur GitHub", en: "Code on GitHub" }, href: "https://github.com/ccochod-source/secure-horizons-soc", kind: "github" }],
  },
  {
    slug: "bizroast",
    title: "Bizroast",
    category: { fr: "SaaS · Analyse business par IA", en: "SaaS · AI business analysis" },
    year: "2026",
    featured: false,
    summary: {
      fr: "Un prototype qui challenge une idée d'entreprise : marché, risques, modèle économique, décision Go/No-Go argumentée et mentor IA qui garde le contexte du rapport.",
      en: "A prototype that challenges a business idea: market, risks, business model, reasoned Go/No-Go decision and an AI mentor that keeps the report's context.",
    },
    tags: ["LLM", "SaaS", "Prototype"],
    skills: ["llm", "prompt-engineering"],
    role: {
      fr: "Définition du parcours, structuration du rapport, conception des critères d'analyse, prototypage de l'interface et du mentor contextualisé.",
      en: "Definition of the flow, structure of the report, design of the analysis criteria, prototyping of the interface and the context-aware mentor.",
    },
    context: {
      fr: "Les porteurs de projet obtiennent facilement des réponses encourageantes, rarement une critique structurée de leurs hypothèses, de leurs risques et de leur modèle économique.",
      en: "Founders easily get encouraging answers, rarely a structured critique of their assumptions, risks and business model.",
    },
    approach: [
      {
        fr: "L'analyse est organisée autour du besoin, du marché, de la concurrence, des risques et de la monétisation ; la sortie comprend une décision Go/No-Go, les hypothèses à tester et un plan de MVP.",
        en: "The analysis is organised around need, market, competition, risks and monetisation; the output includes a Go/No-Go decision, the assumptions to test and an MVP plan.",
      },
      {
        fr: "Un mentor IA conserve le contexte du rapport pour répondre aux questions suivantes sans recommencer l'analyse.",
        en: "An AI mentor keeps the report's context to answer follow-up questions without redoing the analysis.",
      },
    ],
    results: [
      { fr: "Un concept produit cohérent et un prototype pour évaluer le ton critique et l'utilité des recommandations", en: "A coherent product concept and a prototype to assess the critical tone and usefulness of the recommendations" },
    ],
    images: [
      {
        src: "/projects/bizroast/cover.webp",
        alt: { fr: "Visuel éditorial Bizroast : rapport, graphiques et tampon Go / No-Go", en: "Bizroast editorial visual: report, charts and Go / No-Go stamp" },
        width: 1600,
        height: 900,
      },
    ],
  },
  {
    slug: "ping-pang",
    title: "Ping Pang",
    category: { fr: "Architecture data · Sport", en: "Data architecture · Sport" },
    year: "2026",
    featured: false,
    summary: {
      fr: "Deux applications de suivi des entraînements et de classement pour le tennis de table, créées en équipe : architecture Supabase, imports multi-sources et moteur Glicko-2 testé.",
      en: "Two training-tracking and ranking apps for table tennis, built as a team: Supabase architecture, multi-source imports and a tested Glicko-2 engine.",
    },
    tags: ["Supabase", "Glicko-2", "TypeScript"],
    skills: ["supabase", "reprise-donnees", "gestion-droits"],
    role: {
      fr: "Modélisation du schéma, identifiants et déduplication des joueurs, règles de sécurité, préparation des imports et validation du moteur de classement.",
      en: "Schema modelling, player identifiers and deduplication, security rules, import preparation and validation of the ranking engine.",
    },
    context: {
      fr: "Les données viennent de plusieurs sources et ne désignent pas toujours les joueurs de la même façon. Il fallait une base fiable avant d'ajouter les fonctions visibles.",
      en: "Data comes from several sources that don't always name players the same way. A reliable base was needed before adding visible features.",
    },
    approach: [
      {
        fr: "Une architecture Supabase partagée par les applications d'entraînement et de classement ; les imports sont normalisés avant rapprochement avec les profils.",
        en: "A Supabase architecture shared by the training and ranking apps; imports are normalised before matching with profiles.",
      },
      {
        fr: "Le moteur Glicko-2 est isolé et testé pour des calculs reproductibles ; les règles de sécurité limitent accès et modifications selon le rôle.",
        en: "The Glicko-2 engine is isolated and tested for reproducible results; security rules restrict access and edits by role.",
      },
    ],
    results: [
      { fr: "Une fondation commune pour les joueurs, les matchs et les classements", en: "A shared foundation for players, matches and rankings" },
    ],
    images: [
      {
        src: "/projects/ping-pang/cover.webp",
        alt: { fr: "Visuel Ping Pang × Alliance Nîmes Montpellier", en: "Ping Pang × Alliance Nîmes Montpellier visual" },
        width: 718,
        height: 404,
      },
    ],
    links: [{ label: { fr: "Base de données sur GitHub", en: "Database on GitHub" }, href: "https://github.com/ccochod-source/bdd_pingpang", kind: "github" }],
  },
  {
    slug: "auralife",
    title: "Auralife",
    category: { fr: "Site client · Administration & automatisation", en: "Client website · Admin & automation" },
    year: "2026",
    featured: true,
    summary: {
      fr: "Un site en production pour une activité d'accompagnement : blog administrable, témoignages, messages, réglages centralisés et demande d'avis automatique après rendez-vous.",
      en: "A live website for a coaching business: editable blog, testimonials, messages, central settings and an automatic review request after each appointment.",
    },
    tags: ["CMS", "Make", "Webhooks"],
    skills: ["n8n-make", "recueil-besoins"],
    roleShort: { fr: "Produit & développement", en: "Product & development" },
    role: {
      fr: "Cadrage du besoin, organisation des contenus, conception des parcours public et administrateur, développement, automatisations et mise en ligne.",
      en: "Scoping, content organisation, design of the public and admin flows, development, automations and launch.",
    },
    context: {
      fr: "Le besoin dépassait une page vitrine : centraliser services, articles, témoignages, demandes reçues et réglages dans une interface cohérente, sans dépendre d'un développeur pour chaque modification.",
      en: "The need went beyond a showcase page: centralise services, articles, testimonials, incoming requests and settings in one coherent interface, without depending on a developer for every change.",
    },
    approach: [
      {
        fr: "Site public, blog administrable et parcours de contact ; une administration pour gérer articles, témoignages, messages et réglages.",
        en: "Public site, editable blog and contact flow; an admin area to manage articles, testimonials, messages and settings.",
      },
      {
        fr: "Une automatisation envoie une demande d'avis après chaque rendez-vous.",
        en: "An automation sends a review request after each appointment.",
      },
    ],
    results: [
      { fr: "Site en production, modifiable par la cliente", en: "Live in production, editable by the client" },
    ],
    images: [
      {
        src: "/projects/auralife/cover.webp",
        alt: { fr: "Page d'accueil du site Auralife", en: "Auralife website home page" },
        width: 1600,
        height: 953,
      },
    ],
    links: [{ label: { fr: "Visiter Auralife", en: "Visit Auralife" }, href: "https://auralife.fr", kind: "demo" }],
  },
  {
    slug: "eugeniagram",
    title: "Eugeniagram",
    category: { fr: "Projet étudiant · Réseau social de portfolios", en: "Student project · Portfolio social network" },
    year: "2025",
    featured: false,
    summary: {
      fr: "Un fil social de portfolios pour les étudiants : publications de projets, navigation type fil d'actualité et vitrine collective pour l'école et les recruteurs.",
      en: "A social feed of portfolios for students: project posts, feed-style navigation and a collective showcase for the school and recruiters.",
    },
    tags: ["React", "UX"],
    skills: ["react"],
    role: {
      fr: "Participation à la conception produit et à l'expérience utilisateur sur un MVP orienté clarté plutôt qu'accumulation de fonctions.",
      en: "Contribution to product design and user experience on an MVP focused on clarity rather than feature count.",
    },
    context: {
      fr: "Les réalisations étudiantes sont éparpillées (PDF, drive, réseaux personnels) : difficile pour une école de porter une image unifiée, et pour un recruteur de parcourir un parcours cohérent.",
      en: "Student work is scattered (PDFs, drives, personal networks): hard for a school to present a unified image, and for a recruiter to browse a coherent path.",
    },
    approach: [
      {
        fr: "Cartes projet (visuel, titre, contexte, lien), parcours de publication et de découverte, attention au mobile et aux parcours de compte.",
        en: "Project cards (visual, title, context, link), publishing and discovery flows, attention to mobile and account flows.",
      },
    ],
    results: [{ fr: "Un MVP démontré en vidéo", en: "An MVP demonstrated on video" }],
    images: [
      {
        src: "/projects/eugeniagram/cover.webp",
        alt: { fr: "Maquette d'Eugeniagram : fil de publications de projets", en: "Eugeniagram mock-up: feed of project posts" },
        width: 1600,
        height: 900,
      },
    ],
  },
  {
    slug: "ar-plate",
    title: "AR Plate",
    category: { fr: "Étude de marché · FoodTech", en: "Market study · FoodTech" },
    year: "2026",
    featured: false,
    summary: {
      fr: "Étude de marché d'un service IA d'amélioration de photos culinaires pour les restaurateurs : 8 entretiens, 4 hypothèses testées, 5 risques classés avant tout développement.",
      en: "Market study for an AI service improving food photos for restaurants: 8 interviews, 4 hypotheses tested, 5 risks ranked before any development.",
    },
    tags: ["FoodTech", "Interviews", "MVP"],
    skills: ["recueil-besoins", "tests-utilisateurs"],
    role: {
      fr: "Guide d'entretien, conduite et synthèse des échanges, analyse des objections et du prix, transformation des résultats en prochaines expériences.",
      en: "Interview guide, running and summarising the conversations, analysis of objections and pricing, turning results into next experiments.",
    },
    context: {
      fr: "De meilleures photos peuvent-elles créer assez de valeur pour qu'un restaurant adopte et paie un service dédié, sans rendre les plats artificiels ni alourdir le travail de l'équipe ?",
      en: "Can better photos create enough value for a restaurant to adopt and pay for a dedicated service, without making dishes look artificial or adding work for the team?",
    },
    approach: [
      {
        fr: "Huit entretiens avec des restaurateurs pour tester quatre hypothèses : qualité des photos existantes, usages livraison et réseaux sociaux, objections face à la retouche, sensibilité au prix.",
        en: "Eight interviews with restaurant owners to test four hypotheses: quality of existing photos, delivery and social media usage, objections to retouching, price sensitivity.",
      },
      {
        fr: "Cinq risques principaux classés pour préparer un pilote.",
        en: "Five main risks ranked to prepare a pilot.",
      },
    ],
    results: [
      { fr: "Une lecture structurée du marché et un plan de pilote avant développement", en: "A structured reading of the market and a pilot plan before development" },
    ],
    images: [
      {
        src: "/projects/ar-plate/cover.webp",
        alt: { fr: "Visuel éditorial AR Plate", en: "AR Plate editorial visual" },
        width: 1600,
        height: 900,
      },
    ],
  },
  {
    slug: "omi",
    title: "Omi",
    category: { fr: "Produit · Organisation familiale", en: "Product · Family organisation" },
    year: "2026",
    featured: false,
    summary: {
      fr: "Concept d'application pour répartir les tâches familiales, organiser les plannings, préparer les repas et envoyer des rappels, avec un travail sur l'acquisition et la fidélisation.",
      en: "App concept to share family chores, organise schedules, plan meals and send reminders, with work on acquisition and retention.",
    },
    tags: ["B2C", "MVP", "Branding"],
    skills: ["recueil-besoins"],
    role: {
      fr: "Cadrage du problème, définition des utilisateurs, priorisation des fonctions et première stratégie de mise sur le marché.",
      en: "Problem framing, user definition, feature prioritisation and a first go-to-market strategy.",
    },
    context: {
      fr: "Tâches, rendez-vous, repas et rappels sont dispersés entre plusieurs applications ou restent dans la tête d'une seule personne. Le problème est la fragmentation et la difficulté à faire participer toute la famille.",
      en: "Chores, appointments, meals and reminders are scattered across apps or stay in one person's head. The problem is fragmentation and getting the whole family involved.",
    },
    approach: [
      {
        fr: "Omi réunit missions, plannings, repas, messages et rappels ; le travail couvre aussi l'identité de marque, le positionnement B2C et les canaux d'acquisition.",
        en: "Omi gathers missions, schedules, meals, messages and reminders; the work also covers brand identity, B2C positioning and acquisition channels.",
      },
    ],
    results: [
      { fr: "Exploration produit : parcours et approche marketing définis, service non commercialisé", en: "Product exploration: flows and marketing approach defined, service not launched" },
    ],
    images: [
      {
        src: "/projects/omi/cover.webp",
        alt: { fr: "Logo Omi : une maison souriante", en: "Omi logo: a smiling house" },
        width: 1600,
        height: 900,
      },
      {
        src: "/projects/omi/presentation.webp",
        alt: { fr: "Support de présentation Omi : missions, planning, messages, notifications", en: "Omi presentation deck: missions, planning, messages, notifications" },
        width: 1600,
        height: 900,
      },
    ],
  },
  {
    slug: "analyse-accidentologie",
    title: "Analyse Accidentologie",
    category: { fr: "Étude de données · Sécurité routière", en: "Data study · Road safety" },
    year: "2025",
    featured: false,
    summary: {
      fr: "Exploration géographique de l'accidentologie française (base BAAC 2024) avec comparaison métropole / outre-mer et restitution lisible pour un décideur.",
      en: "Geographic exploration of French road accidents (BAAC 2024 database) comparing mainland and overseas territories, delivered in a decision-maker-friendly format.",
    },
    tags: ["BAAC", "Google Sheets", "Data viz"],
    skills: ["dashboards"],
    role: {
      fr: "Construction des indicateurs, choix d'agrégats prudents, rédaction d'un récit chiffré vérifiable et tableaux annexes sous Sheets.",
      en: "Building the indicators, choosing cautious aggregates, writing a verifiable quantified story and annex tables in Sheets.",
    },
    context: {
      fr: "La sécurité routière varie fortement selon les territoires ; les séries nationales masquent des écarts structurels entre métropole et outre-mer.",
      en: "Road safety varies widely across territories; national series hide structural gaps between mainland France and overseas territories.",
    },
    approach: [
      {
        fr: "Analyses territoriales à partir du BAAC 2024, croisées avec quelques corrélats (densité urbaine, profil géographique) lorsque défendables.",
        en: "Territorial analyses based on BAAC 2024, cross-checked with a few correlates (urban density, geography) where defensible.",
      },
    ],
    results: [
      { fr: "Un taux de tués environ 5,7 fois plus élevé outre-mer qu'en métropole selon les calculs documentés", en: "A fatality rate around 5.7 times higher overseas than in mainland France according to the documented calculations" },
    ],
    images: [
      {
        src: "/projects/analyse-accidentologie/cover.webp",
        alt: { fr: "Première diapositive : analyse géographique et territoriale de l'accidentologie", en: "First slide: geographic and territorial analysis of road accidents" },
        width: 1600,
        height: 877,
      },
      {
        src: "/projects/analyse-accidentologie/donnees.webp",
        alt: { fr: "Diapositive présentant les données BAAC utilisées", en: "Slide presenting the BAAC data used" },
        width: 1600,
        height: 900,
      },
    ],
    links: [
      { label: { fr: "Voir les données", en: "See the data" }, href: "https://docs.google.com/spreadsheets/d/1JZKTVJMfaLkBYb8Slpvts0pnSDhyRS8baDxn33wMP68/edit?usp=sharing", kind: "data" },
    ],
  },
];

/** Display order of the Selected Work section; featured projects missing here go last. */
const FEATURED_ORDER = ["brasserie-de-tahiti", "nami", "hackathon-payfit", "hackathon-mirakl", "auralife"];
const featuredRank = (slug: string) => (FEATURED_ORDER.includes(slug) ? FEATURED_ORDER.indexOf(slug) : FEATURED_ORDER.length);
export const featuredProjects = projects.filter((p) => p.featured).sort((a, b) => featuredRank(a.slug) - featuredRank(b.slug));
export const otherProjects = projects.filter((p) => !p.featured);
export const getProject = (slug: string): Project | undefined => projects.find((p) => p.slug === slug);
export const getNextProject = (slug: string): Project => {
  const index = projects.findIndex((p) => p.slug === slug);
  return projects[(index + 1) % projects.length];
};
