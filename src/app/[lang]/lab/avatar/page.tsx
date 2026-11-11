import { getLocale } from "@/app/[lang]/dictionaries";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AvatarLab, type AvatarLabLabels } from "@/components/three/avatar/AvatarLab";
import type { Locale } from "@/i18n";

const copy: Record<Locale, { eyebrow: string; title: string; lead: string; labels: AvatarLabLabels }> = {
  fr: {
    eyebrow: "Lab · Avatar 3D",
    title: "Mon double numérique, en golden hour.",
    lead: "Avatar riggé et animé utilisé dans la narration au scroll : assis dans le hero, il se lève et marche dans le manifeste, puis salue au contact.",
    labels: {
      clipGroup: "Choisir une animation",
      current: "Animation :",
      reducedMotion: "Mouvement réduit activé : l'avatar est affiché en pose fixe.",
      figure: "Avatar 3D de Clément Cochod, animation",
      clips: { Idle: "Debout", SitIdle: "Assis", Walk: "Marche", Wave: "Salut", Celebrate: "Célébration" },
    },
  },
  en: {
    eyebrow: "Lab · 3D avatar",
    title: "My digital twin, at golden hour.",
    lead: "Rigged, animated avatar used in the scroll story: sitting in the hero, standing up and walking in the manifesto, then waving at contact.",
    labels: {
      clipGroup: "Choose an animation",
      current: "Animation:",
      reducedMotion: "Reduced motion is on: the avatar is shown in a still pose.",
      figure: "3D avatar of Clément Cochod, animation",
      clips: { Idle: "Idle", SitIdle: "Sitting", Walk: "Walk", Wave: "Wave", Celebrate: "Celebrate" },
    },
  },
};

export default async function AvatarLabPage() {
  const t = copy[await getLocale()];
  return (
    <main className="min-h-screen bg-cream pt-28 pb-24 text-ink">
      <Container>
        <Eyebrow index="LAB">{t.eyebrow}</Eyebrow>
        <h1 className="mt-6 max-w-3xl text-h1 text-balance">{t.title}</h1>
        <p className="mt-6 max-w-2xl text-lead text-ink-soft">{t.lead}</p>
        <div className="mt-14">
          <AvatarLab labels={t.labels} />
        </div>
      </Container>
    </main>
  );
}
