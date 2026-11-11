import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Magnetic, Reveal } from "@/components/motion";
import { HeroSceneLazy } from "@/components/three/hero/HeroSceneLazy";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { Locale } from "@/i18n";
import { HeroTitle } from "./HeroTitle";
import { AVATAR_ANCHORS } from "@/lib/avatar/story";

export type HeroProps = { lang: Locale; copy: Dictionary["hero"] };

export function Hero({ lang, copy }: HeroProps) {
  return (
    <section
      id="hero"
      data-avatar-anchor={AVATAR_ANCHORS.hero}
      className="golden-hour relative isolate flex min-h-svh flex-col justify-end overflow-hidden pb-10 pt-32 max-md:min-h-[120svh] max-md:justify-start md:pb-14"
    >
      <div id="hero-visual" aria-hidden className="absolute inset-0 -z-10">
        <HeroSceneLazy />
      </div>
      <Container className="relative z-10">
        <Reveal as="div" y={0} delay={0.1}>
          <Eyebrow className="mb-6 opacity-80">{copy.eyebrow}</Eyebrow>
        </Reveal>
        <HeroTitle title={copy.title} className="max-w-3xl text-h1 font-medium lg:max-w-[46rem]" />
        <Reveal as="div" delay={0.5} className="mt-10 flex flex-wrap items-center gap-3 md:mt-14">
          <Magnetic>
            <Button href={`/${lang}#projets`} arrow>
              {copy.ctaProjects}
            </Button>
          </Magnetic>
          <Magnetic>
            <Button href={`/${lang}#contact`} variant="secondary">
              {copy.ctaContact}
            </Button>
          </Magnetic>
        </Reveal>
        <Reveal as="div" delay={0.7} className="mt-12 flex flex-wrap items-center justify-between gap-4 font-mono text-label uppercase md:mt-16">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-ink" aria-hidden />
            {copy.status}
          </span>
          <span className="hidden opacity-70 md:inline">Paris · FR / EN</span>
        </Reveal>
      </Container>
    </section>
  );
}
