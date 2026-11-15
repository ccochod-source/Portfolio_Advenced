"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import { writeHandoff } from "@/lib/gallery/handoff";
import { EASE, MEDIA } from "@/lib/motion/ease";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";
import type { CaseImage } from "./order";

export type NextProjectProps = {
  href: string;
  slug: string;
  title: string;
  category: string;
  year: string;
  cover: CaseImage;
  label: string;
  cursorLabel: string;
  hud: Record<`data-hud-${string}`, string>;
};

const HANDOFF_TIMEOUT = 4000;

/** Leaves a full-viewport copy of the cover on screen until the next page's hero image has painted under it. */
function holdUntilHero(overlay: HTMLElement, slug: string, path: string) {
  const startedAt = performance.now();
  const check = () => {
    const hero = document.querySelector<HTMLImageElement>(`[data-case-slug="${slug}"] [data-case-img]`);
    const ready = window.location.pathname === path && hero?.complete && hero.naturalWidth > 0;
    if (ready || performance.now() - startedAt > HANDOFF_TIMEOUT) {
      gsap.to(overlay, { opacity: 0, duration: 0.35, delay: 0.05, ease: EASE.soft, onComplete: () => overlay.remove() });
      return;
    }
    requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}

/**
 * Giant title of the next case study. On hover (fine pointer) its cover follows the pointer;
 * on click the cover expands to the full viewport, then the next page takes over seamlessly
 * through the gallery handoff. Touch shows the cover statically; reduced motion navigates plainly.
 */
export function NextProject({ href, slug, title, category, year, cover, label, cursorLabel, hud }: NextProjectProps) {
  const root = useRef<HTMLElement>(null);
  const router = useRouter();
  const busy = useRef(false);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const link = q("[data-next-link]")[0] as HTMLElement;
      const [preview] = q("[data-next-preview]");
      const [title] = q("[data-next-title]");
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        gsap.fromTo(
          title,
          { yPercent: 40, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 1.3, ease: EASE.out, scrollTrigger: { trigger: el, start: "top 80%", once: true } },
        );
      });

      mm.add(`${MEDIA.fine} and ${MEDIA.motion}`, () => {
        gsap.set(preview, { xPercent: -50, yPercent: -50, clipPath: "inset(50% 50% 50% 50% round 20px)", rotate: -4 });
        const xTo = gsap.quickTo(preview, "x", { duration: 0.7, ease: "power3.out" });
        const yTo = gsap.quickTo(preview, "y", { duration: 0.7, ease: "power3.out" });
        const rTo = gsap.quickTo(preview, "rotate", { duration: 0.9, ease: "power3.out" });
        let lastX = 0;
        const place = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          xTo(event.clientX - rect.left);
          yTo(event.clientY - rect.top);
          rTo(gsap.utils.clamp(-8, 8, (event.clientX - lastX) * 0.4));
          lastX = event.clientX;
        };
        const enter = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          gsap.set(preview, { x: event.clientX - rect.left, y: event.clientY - rect.top });
          lastX = event.clientX;
          gsap.to(preview, { clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 0.8, ease: EASE.out, overwrite: "auto" });
        };
        const leave = () => {
          if (busy.current) return;
          gsap.to(preview, { clipPath: "inset(50% 50% 50% 50% round 20px)", duration: 0.6, ease: EASE.out, overwrite: "auto" });
        };
        link.addEventListener("pointermove", place);
        link.addEventListener("pointerenter", enter);
        link.addEventListener("pointerleave", leave);
        return () => {
          link.removeEventListener("pointermove", place);
          link.removeEventListener("pointerenter", enter);
          link.removeEventListener("pointerleave", leave);
        };
      });
    },
    { scope: root, revertOnUpdate: true },
  );

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (prefersReducedMotion() || busy.current) return;
    const el = root.current;
    const preview = el?.querySelector<HTMLElement>("[data-next-preview]");
    const still = el?.querySelector<HTMLElement>("[data-next-still]");
    const source = [preview, still].find((node) => node && node.getBoundingClientRect().width > 0 && getComputedStyle(node).clipPath !== "inset(50%)");
    const image = source?.querySelector("img");
    if (!source || !image) return;
    event.preventDefault();
    busy.current = true;

    const rect = source.getBoundingClientRect();
    const overlay = document.createElement("div");
    overlay.className = "case-handoff-overlay";
    overlay.setAttribute("aria-hidden", "true");
    const copy = document.createElement("img");
    copy.src = image.currentSrc || image.src;
    copy.alt = "";
    overlay.append(copy);
    document.body.append(overlay);

    gsap.fromTo(
      overlay,
      { top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: 20 },
      {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        borderRadius: 0,
        duration: 1.05,
        ease: EASE.inOut,
        onComplete: () => {
          writeHandoff(slug);
          router.push(href);
          holdUntilHero(overlay, slug, href);
        },
      },
    );
  };

  return (
    <section ref={root} {...hud} aria-label={label} className="case-next relative overflow-hidden px-5 pb-32 pt-24 md:px-10 md:pb-44 md:pt-36">
      <p className="flex items-center gap-4 font-mono text-label uppercase text-cream-dim">
        <span aria-hidden className="h-px w-10 bg-current opacity-50" />
        {label}
      </p>
      <Link
        href={href}
        onClick={onClick}
        data-next-link
        data-cursor="view"
        data-cursor-label={cursorLabel}
        className="case-next-link group relative mt-8 block rounded-[1.5rem] outline-offset-8"
      >
        <span data-next-still className="case-next-still relative mb-8 block aspect-[16/10] w-full overflow-hidden rounded-[1.25rem]">
          <Image src={cover.src} alt="" fill sizes="100vw" loading="lazy" className="object-cover object-center" />
        </span>
        <span data-next-title className="case-next-title block text-cream transition-colors duration-500 group-hover:text-sun group-focus-visible:text-sun">
          {title}
        </span>
        <span className="mt-6 flex flex-wrap items-center justify-between gap-4 font-mono text-label uppercase text-cream-muted">
          <span>
            {category} — {year}
          </span>
          <span aria-hidden className="case-next-arrow inline-grid size-14 place-items-center rounded-full border border-cream/30 text-lg text-cream transition-[background-color,color,border-color,transform] duration-500 ease-out-expo group-hover:translate-x-2 group-hover:border-sun group-hover:bg-sun group-hover:text-night md:size-20">
            →
          </span>
        </span>
      </Link>
      <span data-next-preview aria-hidden className="case-next-preview pointer-events-none absolute left-0 top-0 z-10 block overflow-hidden rounded-[20px]">
        <Image src={cover.src} alt="" fill sizes="32vw" loading="lazy" className="object-cover object-center" />
      </span>
    </section>
  );
}
