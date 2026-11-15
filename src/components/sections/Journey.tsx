import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { JourneyStep } from "@/content/journey";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";
import { AVATAR_ANCHORS } from "@/lib/avatar/story";

export type JourneyProps = {
  lang: Locale;
  copy: Dictionary["journey"];
  hud: Dictionary["hud"]["sections"]["journey"];
  steps: JourneyStep[];
  id?: string;
  index?: string;
};

export function Journey({ lang, copy, hud, steps, id = "parcours", index = "05" }: JourneyProps) {
  return (
    <section id={id} className="py-24 md:py-36">
      <Container>
        <div className="relative" data-hud-left={hud.left} data-hud-center={hud.center} data-hud-right={hud.right}>
          <Eyebrow index={index}>{copy.eyebrow}</Eyebrow>
          <h2 className="mt-6 max-w-3xl text-h2 font-medium">{copy.title}</h2>
          <div
            aria-hidden
            data-avatar-anchor={AVATAR_ANCHORS.journey}
            className="pointer-events-none absolute bottom-0 right-0 hidden h-[34vh] w-[18vw] min-w-56 md:block"
          />
        </div>

        <Reveal
          as="ol"
          id="journey-track"
          stagger
          className="relative mt-16 grid gap-12 border-l border-cream-muted/20 md:mt-24 md:grid-cols-5 md:gap-6 md:border-l-0 md:border-t"
        >
          {steps.map((step, i) => (
            <li key={step.id} data-journey-step={step.id} className="relative pl-8 md:pl-0 md:pt-10">
              <span
                aria-hidden
                className={`absolute -left-[0.4rem] top-1 size-3 rounded-full md:left-0 md:-top-[0.4rem] ${step.open ? "bg-gold ring-4 ring-gold/25" : "bg-cream-muted"}`}
              />
              <p className="font-mono text-label uppercase text-cream-dim">
                {String(i + 1).padStart(2, "0")} · {t(step.year, lang)}
              </p>
              <p className="mt-3 font-mono text-label uppercase text-cream-dim">{t(step.place, lang)}</p>
              <h3 className="mt-3 text-h3 font-medium">{t(step.title, lang)}</h3>
              {step.open && (
                <Badge tone="gold" className="mt-3">
                  <span aria-hidden className="size-1.5 rounded-full bg-sun-deep" />
                  {copy.open}
                </Badge>
              )}
              <p className="mt-4 text-cream-muted">{t(step.text, lang)}</p>
              {step.open && (
                <div className="mt-6">
                  <Button href={`/${lang}#contact`} arrow>
                    {copy.cta}
                  </Button>
                </div>
              )}
            </li>
          ))}
      </Reveal>
    </Container>
  </section>
);
}
