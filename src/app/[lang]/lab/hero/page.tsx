import type { Metadata } from "next";
import { getLocale } from "@/app/[lang]/dictionaries";
import { HeroSceneLazy } from "@/components/three/hero";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { Locale } from "@/i18n";

export const metadata: Metadata = {
  title: "Lab — Hero scene",
  robots: { index: false, follow: false },
};

const copy: Record<Locale, { eyebrow: string; title: string; lead: string; status: string; hint: string }> = {
  fr: {
    eyebrow: "Eugenia School · IA, Data & Business",
    title: "Je transforme des besoins métier en outils IA.",
    lead: "Scène WebGL « golden hour » : ciel shader, particules dorées et soleil neuronal où l'avatar viendra se poser.",
    status: "Alternance IA · septembre 2027",
    hint: "Lab · bouge la souris",
  },
  en: {
    eyebrow: "Eugenia School · AI, Data & Business",
    title: "I turn business needs into AI tools.",
    lead: "“Golden hour” WebGL scene: shader sky, golden motes and a neural sun where the avatar will land.",
    status: "AI apprenticeship · September 2027",
    hint: "Lab · move the mouse",
  },
};

export default async function HeroLab() {
  const t = copy[await getLocale()];

  return (
    <main className="relative flex min-h-svh flex-col justify-end overflow-hidden pb-10 pt-32">
      <HeroSceneLazy />
      <Container className="relative z-10">
        <Eyebrow className="mb-6 opacity-80">{t.eyebrow}</Eyebrow>
        <h1 className="max-w-6xl text-h1 font-medium">{t.title}</h1>
        <p className="mt-8 max-w-2xl text-lead text-ink-soft">{t.lead}</p>
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 font-mono text-label uppercase">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-ink" aria-hidden />
            {t.status}
          </span>
          <span className="opacity-70">{t.hint}</span>
        </div>
      </Container>
    </main>
  );
}
