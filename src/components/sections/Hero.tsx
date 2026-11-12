import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Magnetic, Reveal } from "@/components/motion";
import { HeroSceneLazy } from "@/components/three/hero/HeroSceneLazy";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n";
import { AVATAR_ANCHORS } from "@/lib/avatar/story";
import { AVATAR_POSTER_URL } from "@/components/three/avatar/clips";
import { HeroZoom } from "./HeroZoom";

export type HeroProps = { lang: Locale; copy: Dictionary["hero"] };

export function Hero({ lang, copy }: HeroProps) {
  return (
    <HeroZoom
      id="hero"
      anchor={AVATAR_ANCHORS.hero}
      className="golden-hour relative isolate flex min-h-svh flex-col overflow-hidden pb-7 pt-28 md:pb-9 md:pt-32"
    >
      <div id="hero-visual" aria-hidden className="absolute inset-0 -z-10">
        <HeroSceneLazy />
        {/* Static avatar poster for prefers-reduced-motion; the animated AvatarLayer is skipped in that case. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative poster, no layout shift (fixed box) */}
        <img
          src={AVATAR_POSTER_URL}
          alt=""
          width={720}
          height={960}
          loading="lazy"
          className="hidden motion-reduce:block absolute bottom-0 right-[6%] h-[60%] w-auto max-w-[45%] object-contain object-bottom md:right-[12%] md:h-[66%]"
        />
      </div>
      <div data-hero-copy className="relative z-10 flex flex-1 flex-col">
        <Container className="flex flex-col items-center text-center">
          <Reveal as="h1" y={24} delay={0.15} start="top bottom" className="bg-gradient-to-b from-sun to-coral bg-clip-text pb-[0.08em] pt-[0.06em] text-[19vw] font-medium leading-[0.86] tracking-[-0.06em] text-transparent md:text-[min(12.5vw,13rem)]">
            {copy.name}
          </Reveal>
          <Reveal as="p" delay={0.35} start="top bottom" className="mt-4 max-w-xl text-balance text-lead text-ink-soft md:mt-6">
            {copy.title}
          </Reveal>
          <Reveal as="div" delay={0.5} start="top bottom" className="mt-7 flex flex-wrap items-center justify-center gap-3 md:mt-9">
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
        </Container>
        <Reveal
          as="div"
          delay={0.7}
          start="top bottom"
          className="mt-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 self-center px-6 pt-10 font-mono text-label uppercase text-ink/70 md:px-12"
        >
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-sun" aria-hidden />
            {copy.status}
          </span>
          <span className="hidden md:inline">{copy.eyebrow}</span>
        </Reveal>
      </div>
    </HeroZoom>
  );
}
