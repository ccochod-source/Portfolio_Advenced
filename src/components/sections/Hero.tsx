import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { Locale } from "@/i18n";

export type HeroProps = { lang: Locale; copy: Dictionary["hero"] };

export function Hero({ lang, copy }: HeroProps) {
  return (
    <section id="hero" className="golden-hour relative isolate flex min-h-svh flex-col justify-end overflow-hidden pb-10 pt-32 md:pb-14">
      <div id="hero-visual" aria-hidden className="absolute inset-0 -z-10" />
      <Container className="relative">
        <Eyebrow className="mb-6 opacity-80">{copy.eyebrow}</Eyebrow>
        <h1 className="max-w-6xl text-h1 font-medium">{copy.title}</h1>
        <div className="mt-10 flex flex-wrap items-center gap-3 md:mt-14">
          <Button href={`/${lang}#projets`} arrow>
            {copy.ctaProjects}
          </Button>
          <Button href={`/${lang}#contact`} variant="secondary">
            {copy.ctaContact}
          </Button>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 font-mono text-label uppercase md:mt-16">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-ink" aria-hidden />
            {copy.status}
          </span>
          <span className="hidden opacity-70 md:inline">Paris · FR / EN</span>
        </div>
      </Container>
    </section>
  );
}
