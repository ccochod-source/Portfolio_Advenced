import { Footer } from "@/components/Footer";
import { Counter, Cursor, Magnetic, Parallax, Reveal, TextReveal } from "@/components/motion";
import { MotionStatus } from "@/components/motion/lab/MotionStatus";
import { PinDemo } from "@/components/motion/lab/PinDemo";
import { PreloaderDemo } from "@/components/motion/lab/PreloaderDemo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import type { Locale } from "@/i18n";
import { getLocale } from "../../dictionaries";

const copy = {
  fr: {
    eyebrow: "Lab · Motion",
    title: "Le mouvement, sans le bruit.",
    lead: "Les primitives GSAP du portfolio. Chaque bloc ci-dessous est un composant réutilisable : sans son, utilisable au clavier, avec un rendu statique quand les animations sont réduites.",
    motionOn: "Animations actives",
    motionOff: "Animations réduites",
    preloader: {
      greeting: "Bonjour.",
      label: "Clément Cochod · Portfolio",
      skipHint: "Cliquer pour passer",
      replay: "Rejouer le preloader",
      done: "page révélée",
    },
    jump: "Aller à",
    text: {
      eyebrow: "TextReveal",
      title: "Le texte monte derrière un masque, ligne par ligne.",
      chars: "Golden hour.",
      words: "Chaque mot arrive à son tour, porté par la lumière de fin de journée.",
      lines:
        "Le composant découpe le texte avec SplitText une fois les polices chargées, le recalcule quand la largeur change, puis rend le HTML d'origine au démontage. Le texte reste lisible par les lecteurs d'écran.",
    },
    reveal: {
      eyebrow: "Reveal",
      title: "Un bloc, ou ses enfants en cascade.",
      single: "Bloc seul : fondu et glissement de 36 px, une seule fois.",
      items: ["Besoin métier", "Prototype", "Agent IA", "Mesure", "Itération", "Mise en ligne"],
    },
    parallax: {
      eyebrow: "Parallax",
      title: "L'image glisse dans son cadre pendant le défilement.",
      cards: ["Lever", "Zénith", "Coucher"],
      caption: "vitesse",
    },
    magnetic: {
      eyebrow: "Magnetic",
      title: "Le bouton suit le pointeur.",
      note: "Souris et trackpad uniquement. Au toucher et au clavier, le bouton reste immobile.",
      primary: "Me contacter",
      secondary: "Voir les projets",
      strong: "Force 0.6",
    },
    cursor: {
      eyebrow: "Cursor",
      title: "Un point, un anneau, un libellé sur les cartes.",
      note: "Le curseur natif reste affiché sur les liens, boutons et champs. Il n'est remplacé que sur les zones marquées data-cursor=\"view\".",
      view: "Voir",
      open: "Ouvrir",
      cardA: "Survolez cette carte",
      cardB: "Libellé personnalisé",
      field: "Champ de test",
    },
    pin: {
      eyebrow: "Pin",
      title: "La section reste, le soleil descend.",
      steps: ["Le jour baisse", "La lumière chauffe", "Golden hour"],
      hint: "Défilez",
    },
    counter: {
      eyebrow: "Counter",
      title: "Les chiffres clés comptent jusqu'à leur valeur.",
      sample: "Valeur d'exemple",
    },
    scroll: {
      eyebrow: "SmoothScroll",
      title: "Les ancres défilent en douceur et s'arrêtent sous la navigation.",
      top: "Retour en haut",
    },
  },
  en: {
    eyebrow: "Lab · Motion",
    title: "Motion, minus the noise.",
    lead: "The portfolio's GSAP primitives. Each block below is a reusable component: no sound, keyboard friendly, with a static render when motion is reduced.",
    motionOn: "Motion on",
    motionOff: "Reduced motion",
    preloader: {
      greeting: "Hello.",
      label: "Clément Cochod · Portfolio",
      skipHint: "Click to skip",
      replay: "Replay the preloader",
      done: "page revealed",
    },
    jump: "Jump to",
    text: {
      eyebrow: "TextReveal",
      title: "Text rises from behind a mask, line by line.",
      chars: "Golden hour.",
      words: "Each word takes its turn, carried by late afternoon light.",
      lines:
        "The component splits the text with SplitText once fonts are loaded, splits again when the width changes, and restores the original HTML on unmount. The text stays readable for screen readers.",
    },
    reveal: {
      eyebrow: "Reveal",
      title: "One block, or its children in sequence.",
      single: "Single block: fade and 36 px slide, played once.",
      items: ["Business need", "Prototype", "AI agent", "Measure", "Iterate", "Ship"],
    },
    parallax: {
      eyebrow: "Parallax",
      title: "The image drifts inside its frame as you scroll.",
      cards: ["Sunrise", "Noon", "Sunset"],
      caption: "speed",
    },
    magnetic: {
      eyebrow: "Magnetic",
      title: "The button follows the pointer.",
      note: "Mouse and trackpad only. With touch and keyboard the button stays still.",
      primary: "Get in touch",
      secondary: "See the projects",
      strong: "Strength 0.6",
    },
    cursor: {
      eyebrow: "Cursor",
      title: "A dot, a ring, and a label on cards.",
      note: "The native cursor stays on links, buttons and fields. It is only replaced over zones marked data-cursor=\"view\".",
      view: "View",
      open: "Open",
      cardA: "Hover this card",
      cardB: "Custom label",
      field: "Test field",
    },
    pin: {
      eyebrow: "Pin",
      title: "The section stays, the sun goes down.",
      steps: ["Daylight fades", "Light warms up", "Golden hour"],
      hint: "Scroll",
    },
    counter: {
      eyebrow: "Counter",
      title: "Key figures count up to their value.",
      sample: "Sample value",
    },
    scroll: {
      eyebrow: "SmoothScroll",
      title: "Anchors scroll smoothly and stop below the navigation.",
      top: "Back to top",
    },
  },
} satisfies Record<Locale, unknown>;

const anchors = ["text", "reveal", "parallax", "magnetic", "cursor", "pin", "counter", "scroll"] as const;
const parallaxSpeeds = [0.12, 0.3, -0.2];
const figures = [16000, 19, 22000];

export default async function MotionLab() {
  const lang = await getLocale();
  const t = copy[lang];
  const labels: Record<(typeof anchors)[number], string> = {
    text: t.text.eyebrow,
    reveal: t.reveal.eyebrow,
    parallax: t.parallax.eyebrow,
    magnetic: t.magnetic.eyebrow,
    cursor: t.cursor.eyebrow,
    pin: t.pin.eyebrow,
    counter: t.counter.eyebrow,
    scroll: t.scroll.eyebrow,
  };
  const jumpNav = (
    <nav aria-label={t.jump} className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-label uppercase">
      <span className="text-ink-soft">{t.jump}</span>
      {anchors.map((anchor) => (
        <a key={anchor} href={`#${anchor}`} className="underline-offset-4 hover:underline">
          {labels[anchor]}
        </a>
      ))}
    </nav>
  );

  return (
    <>
      <Cursor label={t.cursor.view} />
      <main id="top" className="scroll-mt-0 pt-28">
        <section className="pb-24 pt-12 md:pb-36">
          <Container>
            <div className="flex flex-wrap items-center gap-4">
              <Eyebrow index="00">{t.eyebrow}</Eyebrow>
              <MotionStatus on={t.motionOn} off={t.motionOff} />
            </div>
            <TextReveal as="h1" type="chars" className="mt-8 max-w-6xl text-display font-medium">
              {t.title}
            </TextReveal>
            <TextReveal type="lines" delay={0.25} className="mt-10 max-w-2xl text-lead text-ink-soft">
              {t.lead}
            </TextReveal>
            <PreloaderDemo
              greeting={t.preloader.greeting}
              label={t.preloader.label}
              skipHint={t.preloader.skipHint}
              replayLabel={t.preloader.replay}
              doneLabel={t.preloader.done}
            >
              {jumpNav}
            </PreloaderDemo>
          </Container>
        </section>

        <Section id="text" index="01" eyebrow={t.text.eyebrow} className="pt-0!">
          <div className="divide-y divide-ink/10 border-y border-ink/10">
            <div className="grid gap-4 py-10 md:grid-cols-[10rem_1fr]">
              <Badge className="h-fit w-fit">type=&quot;lines&quot;</Badge>
              <TextReveal as="h2" className="max-w-4xl text-h2 font-medium">
                {t.text.title}
              </TextReveal>
            </div>
            <div className="grid gap-4 py-10 md:grid-cols-[10rem_1fr]">
              <Badge className="h-fit w-fit">type=&quot;chars&quot;</Badge>
              <TextReveal as="h3" type="chars" className="text-h1 font-medium text-sun">
                {t.text.chars}
              </TextReveal>
            </div>
            <div className="grid gap-4 py-10 md:grid-cols-[10rem_1fr]">
              <Badge className="h-fit w-fit">type=&quot;words&quot;</Badge>
              <TextReveal type="words" className="max-w-3xl text-h3 font-medium">
                {t.text.words}
              </TextReveal>
            </div>
            <div className="grid gap-4 py-10 md:grid-cols-[10rem_1fr]">
              <Badge className="h-fit w-fit">type=&quot;lines&quot;</Badge>
              <TextReveal className="max-w-2xl text-lead text-ink-soft">{t.text.lines}</TextReveal>
            </div>
          </div>
        </Section>

        <Section id="reveal" index="02" eyebrow={t.reveal.eyebrow} title={t.reveal.title} className="pt-0!">
          <Reveal className="rounded-[1.75rem] bg-cream-deep p-8 text-lead md:p-12">{t.reveal.single}</Reveal>
          <Reveal as="ul" stagger className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            {t.reveal.items.map((item, index) => (
              <li key={item} className="rounded-[1.75rem] border border-ink/10 p-6 md:p-8">
                <span className="font-mono text-label text-sun">0{index + 1}</span>
                <p className="mt-10 text-h3 font-medium">{item}</p>
              </li>
            ))}
          </Reveal>
        </Section>

        <Section id="parallax" index="03" eyebrow={t.parallax.eyebrow} title={t.parallax.title} className="pt-0!">
          <div className="grid gap-6 md:grid-cols-3">
            {t.parallax.cards.map((card, index) => (
              <figure key={card}>
                <Parallax cover speed={parallaxSpeeds[index]} className="aspect-[3/4] rounded-[1.75rem]">
                  <div className="sunset-card flex h-full items-center justify-center">
                    <span aria-hidden className="size-1/2 rounded-full bg-cream/90" />
                  </div>
                </Parallax>
                <figcaption className="mt-4 flex items-baseline justify-between">
                  <span className="text-h3 font-medium">{card}</span>
                  <span className="font-mono text-label uppercase text-ink-soft">
                    {t.parallax.caption} {parallaxSpeeds[index]}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section id="magnetic" index="04" eyebrow={t.magnetic.eyebrow} title={t.magnetic.title} className="pt-0!">
          <div className="flex flex-wrap items-center gap-8">
            <Magnetic>
              <Button href="#scroll" arrow>
                {t.magnetic.primary}
              </Button>
            </Magnetic>
            <Magnetic>
              <Button href="#reveal" variant="secondary">
                {t.magnetic.secondary}
              </Button>
            </Magnetic>
            <Magnetic strength={0.6}>
              <span className="grid size-28 place-items-center rounded-full bg-sun text-center font-mono text-label uppercase text-cream">
                {t.magnetic.strong}
              </span>
            </Magnetic>
          </div>
          <p className="mt-8 max-w-xl text-ink-soft">{t.magnetic.note}</p>
        </Section>

        <Section id="cursor" index="05" eyebrow={t.cursor.eyebrow} title={t.cursor.title} className="pt-0!">
          <div className="grid gap-6 md:grid-cols-2">
            <a
              href="#pin"
              data-cursor="view"
              className="sunset-card flex aspect-[16/10] items-end rounded-[1.75rem] p-8 text-h3 font-medium text-cream"
            >
              {t.cursor.cardA}
            </a>
            <a
              href="#counter"
              data-cursor="view"
              data-cursor-label={t.cursor.open}
              className="flex aspect-[16/10] items-end rounded-[1.75rem] bg-ink p-8 text-h3 font-medium text-cream"
            >
              {t.cursor.cardB}
            </a>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <p className="max-w-xl text-ink-soft">{t.cursor.note}</p>
            <label className="block font-mono text-label uppercase text-ink-soft">
              {t.cursor.field}
              <input
                type="text"
                className="mt-2 block w-full rounded-full border border-ink/25 bg-transparent px-5 py-3 font-sans text-base normal-case tracking-normal text-ink"
              />
            </label>
          </div>
        </Section>

        <PinDemo id="pin" eyebrow={`06 · ${t.pin.eyebrow}`} title={t.pin.title} steps={t.pin.steps} hint={t.pin.hint} />

        <Section id="counter" index="07" eyebrow={t.counter.eyebrow} title={t.counter.title}>
          <dl className="grid gap-10 border-t border-ink/10 pt-10 md:grid-cols-3">
            {figures.map((figure) => (
              <div key={figure} className="flex flex-col-reverse gap-3">
                <dt className="font-mono text-label uppercase text-ink-soft">{t.counter.sample}</dt>
                <dd className="text-h1 font-medium">
                  <Counter value={figure} locale={lang} />
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="scroll" index="08" eyebrow={t.scroll.eyebrow} title={t.scroll.title} className="pt-0!">
          <div className="space-y-8">
            {jumpNav}
            <Magnetic>
              <Button href="#top" variant="secondary" arrow>
                {t.scroll.top}
              </Button>
            </Magnetic>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
