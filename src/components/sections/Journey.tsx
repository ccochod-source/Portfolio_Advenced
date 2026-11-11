import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { JourneyStep } from "@/content/journey";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";

export type JourneyProps = {
  lang: Locale;
  copy: Dictionary["journey"];
  steps: JourneyStep[];
  id?: string;
  index?: string;
};

export function Journey({ lang, copy, steps, id = "parcours", index = "05" }: JourneyProps) {
  return (
    <section id={id} className="bg-cream-deep/40 py-24 md:py-36">
      <Container>
        <Eyebrow index={index}>{copy.eyebrow}</Eyebrow>
        <h2 className="mt-6 max-w-5xl text-h2 font-medium">{copy.title}</h2>

        <ol id="journey-track" className="relative mt-16 border-l border-ink/15 md:mt-24 md:border-l-0 md:border-t">
          <div className="grid gap-12 md:grid-cols-5 md:gap-6">
            {steps.map((step, i) => (
              <li key={step.id} data-journey-step={step.id} className="relative pl-8 md:pl-0 md:pt-10">
                <span
                  aria-hidden
                  className={`absolute -left-[0.4rem] top-1 size-3 rounded-full md:left-0 md:-top-[0.4rem] ${step.open ? "bg-sun ring-4 ring-sun/25" : "bg-ink"}`}
                />
                <p className="font-mono text-label uppercase text-sun">
                  {String(i + 1).padStart(2, "0")} · {t(step.year, lang)}
                </p>
                <p className="mt-3 font-mono text-label uppercase text-ink-soft">{t(step.place, lang)}</p>
                <h3 className="mt-3 text-h3 font-medium">{t(step.title, lang)}</h3>
                <p className="mt-4 text-ink-soft">{t(step.text, lang)}</p>
                {step.open && (
                  <div className="mt-6">
                    <Button href={`/${lang}#contact`} arrow>
                      {copy.cta}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </div>
        </ol>
      </Container>
    </section>
  );
}
