"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Badge } from "@/components/ui/Badge";
import { readHandoff } from "@/lib/gallery/handoff";
import { EASE, MEDIA } from "@/lib/motion/ease";
import { gsap, SplitText, useGSAP } from "@/lib/motion/gsap";
import { whenPageRevealed } from "@/lib/motion/preloader";
import { getLenis } from "@/lib/motion/scroll";
import type { CaseImage } from "./order";
import "./case.css";

export type CaseHeroProps = {
  slug: string;
  title: string;
  category: string;
  year: string;
  award?: string;
  cover: CaseImage;
  eyebrow: string;
  counter: string;
  counterLabel: string;
  backHref: string;
  backLabel: string;
  hud: Record<`data-hud-${string}`, string>;
};

const FONT_TIMEOUT = 1500;
const INTRO_CLIP = "inset(18% 16% 18% 16% round 28px)";
const FULL_CLIP = "inset(0% 0% 0% 0% round 0px)";

/**
 * Full-bleed cover at 100svh with the title in huge type. Arriving from the gallery expand
 * (`readHandoff`), the first frame is the bare full-viewport cover and only the text reveals;
 * otherwise the cover opens from a rounded window. On scroll the cover shrinks into a rounded,
 * dimmed frame while the content rises. Reduced motion: no clip/scale/pin, plain fades.
 */
export function CaseHero({ slug, title, category, year, award, cover, eyebrow, counter, counterLabel, backHref, backLabel, hud }: CaseHeroProps) {
  const root = useRef<HTMLElement>(null);
  const handoff = useRef<boolean | null>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (handoff.current === null) handoff.current = readHandoff(slug);
      const fromGallery = handoff.current;
      const q = gsap.utils.selector(el);
      const [frame] = q("[data-case-frame]");
      const [clip] = q("[data-case-clip]");
      const [img] = q("[data-case-img]");
      const [scrim] = q("[data-case-scrim]");
      const [shade] = q("[data-case-shade]");
      const [top] = q("[data-case-top]");
      const [bottom] = q("[data-case-bottom]");
      const [heading] = q("[data-case-title]");
      const reveals = q("[data-case-reveal]");
      const mm = gsap.matchMedia();

      mm.add({ motion: MEDIA.motion, mobile: MEDIA.mobile }, (context) => {
        const { motion, mobile } = context.conditions as { motion: boolean; mobile: boolean };
        let cancelWait = () => {};

        if (!motion) {
          el.removeAttribute("data-intro");
          heading.removeAttribute("data-title-pending");
          const fade = gsap.fromTo([heading, ...reveals], { opacity: 0 }, { opacity: 1, duration: 0.6, ease: EASE.soft, stagger: 0.06, paused: true });
          cancelWait = whenPageRevealed(() => fade.play());
          return () => cancelWait();
        }

        if (fromGallery) {
          getLenis()?.scrollTo(0, { immediate: true, force: true });
          window.scrollTo(0, 0);
        }

        const textAt = fromGallery ? 0.1 : 0.95;
        const intro = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
        if (!fromGallery) {
          intro
            .fromTo(clip, { clipPath: INTRO_CLIP }, { clipPath: FULL_CLIP, duration: 1.6, ease: EASE.inOut }, 0)
            .fromTo(img, { scale: 1.32 }, { scale: 1, duration: 2.1, ease: EASE.inOut }, 0);
        }
        intro
          .fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: EASE.soft }, textAt)
          .fromTo(reveals, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09 }, textAt + 0.3);
        // Start states are applied: the CSS pending state can go before the first paint.
        el.removeAttribute("data-intro");

        let cancelled = false;
        let started = false;
        let split: SplitText | undefined;
        const start = () => {
          if (cancelled || started) return;
          started = true;
          split = SplitText.create(heading, { type: "lines,chars", mask: "lines", linesClass: "motion-line", aria: "auto" });
          heading.removeAttribute("data-title-pending");
          intro.fromTo(
            split.chars,
            { yPercent: 118 },
            {
              yPercent: 0,
              duration: 1.3,
              stagger: 0.032,
              onComplete: () => {
                split?.revert();
                split = undefined;
              },
            },
            textAt,
          );
          cancelWait = whenPageRevealed(() => intro.play());
        };
        const timeout = window.setTimeout(start, FONT_TIMEOUT);
        document.fonts.ready.then(() => {
          window.clearTimeout(timeout);
          start();
        });

        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: true } })
          .fromTo(frame, { scale: 1, borderRadius: 0 }, { scale: mobile ? 0.9 : 0.84, borderRadius: mobile ? 20 : 36, ease: EASE.linear }, 0)
          .fromTo(shade, { opacity: 0 }, { opacity: 0.55, ease: EASE.linear }, 0)
          .fromTo(top, { opacity: 1 }, { opacity: 0, duration: 0.25, ease: EASE.linear }, 0)
          .fromTo(bottom, { y: 0 }, { y: mobile ? -36 : -96, ease: EASE.linear }, 0);

        return () => {
          cancelled = true;
          window.clearTimeout(timeout);
          cancelWait();
          split?.revert();
        };
      });
    },
    { scope: root, dependencies: [slug], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      {...hud}
      data-intro="pending"
      data-case-slug={slug}
      aria-labelledby="case-title"
      className="case-hero relative h-svh motion-safe:h-[130svh] md:motion-safe:h-[150svh]"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <div data-case-frame className="absolute inset-0 overflow-hidden bg-night will-change-transform">
          <div data-case-clip className="case-hero-clip absolute inset-0">
            <Image
              data-case-img
              src={cover.src}
              alt={cover.alt}
              fill
              sizes="100vw"
              preload
              className="case-hero-img object-cover object-center"
            />
          </div>
          <div data-case-scrim aria-hidden className="case-hero-scrim absolute inset-0" />
          <div data-case-shade aria-hidden className="absolute inset-0 bg-night opacity-0" />
        </div>

        <div data-case-content className="absolute inset-0 flex flex-col justify-between px-5 pb-20 pt-24 md:px-10 md:pb-24 md:pt-28">
          <div data-case-top>
          <div data-case-reveal className="flex items-center justify-between gap-6 font-mono text-label uppercase text-cream">
            <Link href={backHref} className="group inline-flex min-h-11 items-center gap-2 underline decoration-cream/30 underline-offset-4 hover:decoration-current">
              <span aria-hidden className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-1">
                ←
              </span>
              {backLabel}
            </Link>
            <p aria-label={counterLabel} className="tabular-nums">
              {counter}
            </p>
          </div>
          </div>

          <div data-case-bottom>
            <div data-case-reveal className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 font-mono text-label uppercase text-cream-muted">
              <p>
                {eyebrow} — {category}
              </p>
              <p className="tabular-nums">{year}</p>
            </div>
            <h1 id="case-title" data-case-title data-title-pending="" className="case-hero-title mt-5 text-cream">
              {title}
            </h1>
            {award && (
              <p data-case-reveal className="mt-6">
                <Badge tone="gold">★ {award}</Badge>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
