"use client";

import Image from "next/image";
import { useRef } from "react";
import { EASE, MEDIA } from "@/lib/motion/ease";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import type { CaseImage } from "./order";

export type ParallaxFigureProps = {
  image: CaseImage;
  /** "Fig. 01" */
  label: string;
  layout: "full" | "left" | "right";
};

const sizesFor = { full: "100vw", left: "(max-width: 767px) 100vw, 72vw", right: "(max-width: 767px) 100vw, 72vw" } as const;

/** Huge rounded image whose picture drifts slower than its frame, opening from a slightly inset window as it enters. */
export function ParallaxFigure({ image, label, layout }: ParallaxFigureProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(ref);
      const [frame] = q("[data-figure-frame]");
      const [inner] = q("[data-figure-inner]");
      const mm = gsap.matchMedia();
      mm.add({ motion: MEDIA.motion, mobile: MEDIA.mobile }, (context) => {
        const { motion, mobile } = context.conditions as { motion: boolean; mobile: boolean };
        if (!motion) return;
        const drift = mobile ? 4 : 7;
        gsap.fromTo(
          inner,
          { yPercent: -drift },
          { yPercent: drift, ease: EASE.linear, scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } },
        );
        gsap.fromTo(
          frame,
          { clipPath: `inset(7% ${mobile ? 3 : 6}% 7% ${mobile ? 3 : 6}% round var(--case-radius))` },
          {
            clipPath: "inset(0% 0% 0% 0% round var(--case-radius))",
            ease: EASE.linear,
            scrollTrigger: { trigger: frame, start: "top bottom", end: "top 30%", scrub: true },
          },
        );
      });
    },
    { scope: ref, revertOnUpdate: true },
  );

  const ratio = image.width / image.height;
  return (
    <figure ref={ref} className={`case-figure case-figure--${layout}`}>
      <div
        data-figure-frame
        className="case-figure-frame relative overflow-hidden bg-umber"
        style={{ aspectRatio: `${image.width} / ${image.height}`, width: `min(100%, calc(86svh * ${ratio.toFixed(4)}))` }}
      >
        <div data-figure-inner className="absolute inset-0 scale-[1.16] will-change-transform">
          <Image src={image.src} alt={image.alt} fill sizes={sizesFor[layout]} loading="lazy" className="object-cover object-center" />
        </div>
      </div>
      <figcaption className="case-figure-caption mt-4 flex gap-5 md:mt-5">
        <span className="shrink-0 font-mono text-label uppercase text-sun tabular-nums">{label}</span>
        <span className="max-w-xl text-sm leading-snug text-cream-muted">{image.alt}</span>
      </figcaption>
    </figure>
  );
}
