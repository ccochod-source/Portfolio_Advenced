"use client";

import { useRef, type ReactNode } from "react";
import { MEDIA } from "@/lib/motion/ease";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { useWebGL } from "@/components/three/useWebGL";
import { HERO_MODE } from "@/lib/hero/mode";
import { VIDEO_ZOOM, ZOOM, setZoomProgress } from "@/lib/hero/zoom";

type HeroZoomProps = {
  id: string;
  className: string;
  children: ReactNode;
};

const DEEP_LINK_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/**
 * A page opened on `/#contact` is scrolled by the browser before the pin spacer exists: keep the target
 * aligned through the first refreshes, until the visitor takes over.
 */
function keepDeepLink() {
  let target: HTMLElement | null = null;
  try {
    target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  } catch {}
  if (!target) return () => {};
  const align = () => target.scrollIntoView({ behavior: "instant", block: "start" });
  const release = () => {
    ScrollTrigger.removeEventListener("refresh", align);
    DEEP_LINK_EVENTS.forEach((type) => window.removeEventListener(type, release));
    window.clearTimeout(timeout);
  };
  const timeout = window.setTimeout(release, 6000);
  ScrollTrigger.addEventListener("refresh", align);
  DEEP_LINK_EVENTS.forEach((type) => window.addEventListener(type, release, { passive: true }));
  return release;
}

/**
 * Pins the hero while the camera zooms into the laptop screen (progress → `src/lib/hero/zoom.ts`).
 * The hero copy (`[data-hero-copy]`) fades out first; the whole hero fades out at the end, revealing the
 * manifesto that has been pulled up by one viewport (negative margin) so it sits exactly under the screen.
 * Reduced motion disables pinning; the 3D mode also requires WebGL.
 */
export function HeroZoom({ id, className, children }: HeroZoomProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const webgl = useWebGL();

  useGSAP(
    () => {
      const el = section.current;
      const wrap = wrapper.current;
      if (!el || !wrap) return;
      const copy = el.querySelector<HTMLElement>("[data-hero-copy]");
      const mm = gsap.matchMedia();

      mm.add({ motion: MEDIA.motion, mobile: MEDIA.mobile, portrait: "(max-aspect-ratio: 1/1)" }, (context) => {
        const { motion, mobile, portrait } = context.conditions as {
          motion: boolean;
          mobile: boolean;
          portrait: boolean;
        };
        setZoomProgress(0);
        if (!motion || (HERO_MODE === "3d" && !webgl)) return;

        const pinMobile = HERO_MODE === "video" ? portrait : mobile;
        const pinLength = HERO_MODE === "video" ? VIDEO_ZOOM.pinLength : ZOOM.pinLength;
        const length = pinMobile ? pinLength.mobile : pinLength.desktop;
        // The next section must reach the viewport top exactly when the pin ends: pull it up by one viewport.
        const pull = () => {
          wrap.style.marginBottom = `-${window.innerHeight}px`;
        };
        pull();
        ScrollTrigger.addEventListener("refreshInit", pull);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${window.innerHeight * length}`,
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // Refreshed before the manifesto pin so its spacer is in place when the latter measures its start.
            refreshPriority: 1,
            onUpdate: (self) => setZoomProgress(self.progress),
          },
        });
        if (copy) tl.to(copy, { autoAlpha: 0, y: -40, ease: "power2.inOut", duration: ZOOM.copyFadeEnd }, 0);
        tl.to(el, { autoAlpha: 0, duration: 1 - ZOOM.handoverStart }, ZOOM.handoverStart);
        const releaseDeepLink = keepDeepLink();

        return () => {
          releaseDeepLink();
          ScrollTrigger.removeEventListener("refreshInit", pull);
          wrap.style.marginBottom = "";
          setZoomProgress(0);
        };
      });
    },
    { scope: wrapper, dependencies: [HERO_MODE === "3d" ? webgl : true], revertOnUpdate: true },
  );

  return (
    <div ref={wrapper} className="relative z-10">
      <section ref={section} id={id} className={className}>
        {children}
      </section>
    </div>
  );
}
