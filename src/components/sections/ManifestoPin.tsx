"use client";

import { useRef, type ReactNode } from "react";
import { Pin } from "@/components/motion";
import { setManifestoProgress } from "@/lib/avatar/story";
import { ZOOM_PAGE_ATTR } from "@/lib/hero/zoom";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { EASE, MEDIA } from "@/lib/motion/ease";

/** Preserve the hero's painted-page target and the existing pin/character progress contract. */
export function ManifestoPin({
  id,
  children,
  hud,
}: {
  id: string;
  children: ReactNode;
  hud: { left: string; center: string; right: string };
}) {
  const scope = useRef<HTMLDivElement>(null);
  const reveal = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    const root = scope.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(`(min-width: 768px) and ${MEDIA.motion}`, () => {
      const words = root.querySelectorAll("[data-manifesto-word]");
      const rows = root.querySelectorAll("[data-manifesto-principle]");
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.soft } });
      // Initial geometry stays stable through the texture → DOM handover; only the intro reveals.
      tl.fromTo(words, { opacity: 0.82, filter: "blur(0.7px)", y: 5 }, { opacity: 1, filter: "blur(0px)", y: 0, stagger: 0.012, duration: 0.2 }, 0.02);
      rows.forEach((row, i) => {
        tl.fromTo(row, { opacity: 0.82 }, { opacity: 1, duration: 0.18 }, 0.3 + i * 0.2);
        tl.fromTo(row.querySelector("[data-principle-number]"), { color: "#d9bfa8" }, { color: "#ffc145", duration: 0.18 }, 0.3 + i * 0.2);
      });
      reveal.current = tl;
      return () => { reveal.current = null; };
    });
    return () => mm.revert();
  }, { scope });

  const onProgress = (progress: number) => {
    setManifestoProgress(progress);
    reveal.current?.progress(progress);
  };

  return (
    <div ref={scope}>
      <Pin
        as="section"
        id={id}
        data-hud-left={hud.left}
        data-hud-center={hud.center}
        data-hud-right={hud.right}
        {...{ [ZOOM_PAGE_ATTR]: "" }}
        length={1.1}
        pinOnMobile={false}
        onProgress={onProgress}
        className="relative"
        innerClassName="manifesto-stage relative flex flex-col justify-between overflow-hidden pt-28 pb-24 md:min-h-svh md:pt-24 md:pb-20"
      >
        {children}
      </Pin>
    </div>
  );
}
