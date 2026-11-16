import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Magnetic, Reveal } from "@/components/motion";
import { HeroVideo } from "@/components/three/hero/HeroVideo";
import { HeroSceneLazy } from "@/components/three/hero/HeroSceneLazy";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n";
import { AVATAR_POSTER_URL } from "@/components/three/avatar/clips";
import { HERO_MODE } from "@/lib/hero/mode";
import { HeroZoom } from "./HeroZoom";

export type HeroProps = { lang: Locale; copy: Dictionary["hero"] };

export function Hero({ lang, copy }: HeroProps) {
  return (
    <HeroZoom
      id="hero"
      className={`golden-hour ${HERO_MODE === "video" ? "hero-video" : ""} relative isolate flex min-h-svh flex-col overflow-hidden pb-7 ${
        HERO_MODE === "video" ? "pt-16" : "pt-28"
      } md:pb-9 ${HERO_MODE === "video" ? "md:pt-16" : "md:pt-32"}`}
    >
      <div id="hero-visual" aria-hidden className="absolute inset-0 -z-10">
        {HERO_MODE === "video" ? (
          <HeroVideo />
        ) : (
          <>
            <HeroSceneLazy />
            {/* Static poster of the set (avatar on the cloud) for prefers-reduced-motion; the animated set is skipped in that case. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative poster, no layout shift (fixed box) */}
            <img
              src={AVATAR_POSTER_URL}
              alt=""
              width={720}
              height={960}
              loading="lazy"
              className="hidden motion-reduce:block absolute bottom-[4%] right-[8%] h-[46%] w-auto max-w-[60%] object-contain object-bottom md:right-[16%] md:h-[58%]"
            />
          </>
        )}
      </div>
      {/* Golden-hour haze behind the copy: keeps the coral wordmark legible over the bright sunset band. */}
      {HERO_MODE === "3d" && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[62%] bg-gradient-to-b from-cream/60 via-cream/30 to-transparent motion-reduce:hidden" />
      )}
      {HERO_MODE === "video" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[40%] w-full bg-gradient-to-t from-night/80 via-night/70 to-transparent"
        />
      )}
      {HERO_MODE === "video" ? (
        <div data-hero-copy className="relative z-10 flex flex-1 flex-col">
          <Container className="flex flex-col items-center text-center">
            <Reveal
              as="h1"
              y={24}
              delay={0.15}
              start="top bottom"
              className="bg-gradient-to-b from-sun to-coral bg-clip-text pb-[0.08em] pt-[0.06em] text-[17vw] font-medium leading-[0.86] tracking-[-0.06em] text-transparent md:text-[min(9vw,9.5rem)]"
            >
              {copy.name}
            </Reveal>
          </Container>
          <Container className="absolute inset-x-0 bottom-[5.5rem] flex flex-col items-start text-left">
            <Reveal as="p" delay={0.35} start="top bottom" className="max-w-xl text-balance text-lead text-cream">
              {copy.title}
            </Reveal>
            <Reveal as="div" delay={0.5} start="top bottom" className="mt-5 flex flex-wrap items-center justify-start gap-3">
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
            className="mt-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 self-center px-6 pt-10 font-mono text-label uppercase text-cream/80 md:px-12"
          >
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-sun" aria-hidden />
              {copy.status}
            </span>
            <span className="hidden md:inline">{copy.eyebrow}</span>
          </Reveal>
        </div>
      ) : (
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
      )}
    </HeroZoom>
  );
}
