import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Styleguide — Clément Cochod",
  robots: { index: false, follow: false },
};

const colors = [
  { name: "cream", hex: "#FFF4E6", className: "bg-cream border border-ink/10" },
  { name: "cream-deep", hex: "#FFE4C4", className: "bg-cream-deep" },
  { name: "gold", hex: "#FFC145", className: "bg-gold" },
  { name: "sun", hex: "#FF7A1A", className: "bg-sun" },
  { name: "coral", hex: "#FF5A4E", className: "bg-coral" },
  { name: "ink-soft", hex: "#6B4A3A", className: "bg-ink-soft" },
  { name: "ink", hex: "#2B1A12", className: "bg-ink" },
];

const typeScale = [
  { name: "display", className: "text-display", sample: "IA × Business." },
  { name: "h1", className: "text-h1", sample: "Je transforme des besoins métier en outils IA." },
  { name: "h2", className: "text-h2", sample: "Projets sélectionnés" },
  { name: "h3", className: "text-h3", sample: "Nami — agent de voyage vocal" },
  { name: "lead", className: "text-lead", sample: "Étudiant à Eugenia School, je conçois des applications et des agents IA à partir de besoins métier." },
  { name: "body", className: "text-base", sample: "Texte courant : 16 px, Space Grotesk, interlignage confortable pour la lecture." },
  { name: "label", className: "font-mono text-label uppercase", sample: "Eugenia School · IA, Data & Business" },
];

export default function Styleguide() {
  return (
    <>
      <main className="pt-28">
        <Section index="00" eyebrow="Styleguide" title="Golden hour — design system" />

        <Section index="01" eyebrow="Couleurs" className="pt-0!">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {colors.map((c) => (
              <div key={c.name}>
                <div className={`aspect-square rounded-2xl ${c.className}`} />
                <p className="mt-3 font-medium">{c.name}</p>
                <p className="font-mono text-label text-ink-soft">{c.hex}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="golden-hour h-40 rounded-2xl" />
            <div className="sunset-card h-40 rounded-2xl" />
          </div>
        </Section>

        <Section index="02" eyebrow="Typographie" className="pt-0!">
          <div className="divide-y divide-ink/10 border-y border-ink/10">
            {typeScale.map((t) => (
              <div key={t.name} className="grid gap-4 py-8 md:grid-cols-[10rem_1fr]">
                <span className="font-mono text-label uppercase text-ink-soft">{t.name}</span>
                <p className={`${t.className} font-medium`}>{t.sample}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section index="03" eyebrow="Boutons & badges" className="pt-0!">
          <div className="flex flex-wrap items-center gap-4">
            <Button href="#" arrow>Me contacter</Button>
            <Button href="#" variant="secondary">Voir les projets</Button>
            <Button href="#" variant="link" arrow>Lire l&apos;étude de cas</Button>
            <span className="rounded-full bg-ink p-2">
              <Button href="#" variant="light" arrow>Télécharger mon CV</Button>
            </span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Badge tone="gold">★ 1er prix PayFit</Badge>
            <Badge tone="gold">★ 1er cas d&apos;usage Mirakl</Badge>
            <Badge tone="dark">Chef de projet ESSEC</Badge>
            <Badge>RAG</Badge>
            <Badge>Agents IA</Badge>
            <Badge>Next.js</Badge>
          </div>
        </Section>

        <Section index="04" eyebrow="Cartes projet" className="pt-0!">
          <div className="grid gap-12 md:grid-cols-2">
            <ProjectCard
              href="#"
              title="Nami"
              category="Hackathon H Company × 42AI"
              year="2026"
              summary="Agent de voyage vocal qui remplit les formulaires officiels dans un Chrome visible et s'arrête avant tout paiement."
              tags={["Computer use", "Agents IA", "Next.js"]}
            />
            <ProjectCard
              href="#"
              title="PayFit"
              category="Hackathon · Rédaction assistée"
              year="2026"
              award="1er prix"
              summary="Plateforme de rédaction d'articles paie/RH avec agents Dust : EEAT, SEO et garde-fous juridiques."
              tags={["Dust", "React", "Vercel"]}
            />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
