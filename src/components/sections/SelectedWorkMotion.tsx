"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { GalleryCanvasLazy } from "@/components/three/gallery";
import { useAfterLoad } from "@/components/three/useAfterLoad";
import { useWebGL } from "@/components/three/useWebGL";
import { writeHandoff } from "@/lib/gallery/handoff";
import { computeLayout, hitTest } from "@/lib/gallery/layout";
import { gallery, resetGalleryExpand, stepGallery } from "@/lib/gallery/store";
import type { GalleryItem } from "@/lib/gallery/types";
import { useMedia } from "@/lib/gallery/useMedia";
import { setHud } from "@/lib/hud/store";
import { EASE, MEDIA } from "@/lib/motion/ease";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { getLenis, lockScroll, unlockScroll } from "@/lib/motion/scroll";

export type GalleryCopy = {
  aria: string;
  drag: string;
  open: string;
  hint: string;
  swipe: string;
  listLabel: string;
  current: string;
  opening: string;
  yearLabel: string;
  roleLabel: string;
  categoryLabel: string;
  hudCenter: string;
};

export type SelectedWorkGalleryProps = { items: GalleryItem[]; copy: GalleryCopy; hud: { left: string; center: string; right: string } };

const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
const plainClick = (event: ReactMouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

/**
 * Curved WebGL gallery from md up (pinned, scroll / drag / wheel / keys); horizontal scroll-snap DOM carousel on
 * phones, with reduced motion or without WebGL. Both open a project through the same full-viewport cover handoff.
 */
export function SelectedWorkGallery(props: SelectedWorkGalleryProps) {
  const webgl = useWebGL();
  const reduce = useMedia(MEDIA.reduce);
  const mobile = useMedia(MEDIA.mobile);
  if (webgl && !reduce && !mobile) return <GalleryStage {...props} />;
  return <GalleryFallback {...props} reduce={reduce} />;
}

function GalleryMeta({ item, index, count, copy }: { item: GalleryItem; index: number; count: number; copy: GalleryCopy }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useGSAP(
    () => {
      if (first.current) {
        first.current = false;
        return;
      }
      const lines = ref.current?.querySelectorAll("[data-swap]");
      if (!lines?.length) return;
      gsap.fromTo(
        lines,
        { yPercent: 110, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: EASE.out, stagger: 0.045, overwrite: true },
      );
    },
    { scope: ref, dependencies: [index], revertOnUpdate: false },
  );

  return (
    <div ref={ref} className="mx-auto flex w-fit max-w-full flex-col items-center rounded-lg bg-night/95 px-5 py-3 text-center">
      <p className="overflow-hidden font-mono text-label uppercase text-sun">
        <span data-swap className="block">
          {pad(index + 1)} / {pad(count)}
        </span>
      </p>
      <h3 className="mt-3 overflow-hidden pb-[0.08em] text-h3 font-medium text-cream">
        <span data-swap className="block">
          {item.title}
        </span>
      </h3>
      <dl className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-mono text-label uppercase text-cream">
        {[
          [copy.categoryLabel, item.category],
          [copy.yearLabel, item.year],
          [copy.roleLabel, item.role],
        ].map(([label, value]) => (
          <div key={label} className="overflow-hidden">
            <div data-swap className="flex gap-2">
              <dt className="sr-only">{label}</dt>
              <dd>{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

function GalleryStage({ items, copy, hud }: SelectedWorkGalleryProps) {
  const router = useRouter();
  const stage = useRef<HTMLDivElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const labelText = useRef<HTMLSpanElement>(null);
  const ready = useRef(false);
  const api = useRef<{ goTo: (i: number) => void; open: (i: number) => void; focus: (i: number) => void } | null>(null);
  const [index, setIndex] = useState(0);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const afterLoad = useAfterLoad();
  const count = items.length;

  const onReady = useCallback(() => {
    ready.current = true;
    gsap.to(canvasWrap.current, { autoAlpha: 1, duration: 1.2, ease: EASE.soft });
  }, []);

  useGSAP(
    () => {
      const el = stage.current;
      if (!el) return;
      const n = items.length;
      const last = Math.max(1, n - 1);
      Object.assign(gallery, { count: n, target: 0, current: 0, display: 0, velocity: 0, hover: -1, dragging: false, intro: 0 });
      resetGalleryExpand();
      const chrome = el.querySelectorAll("[data-gallery-chrome]");
      gsap.set(chrome, { autoAlpha: 1 });
      gsap.set(el, { cursor: "" });

      let shown = -1;
      let opening = false;
      let locked = false;
      let snapTimer = 0;
      let autoUntil = 0;

      const pushHud = (i: number) =>
        setHud({ left: items[i].title.toUpperCase(), center: copy.hudCenter, right: `${pad(i + 1)} / ${pad(n)}` });

      const intro = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "top top",
        onUpdate: (self) => (gallery.intro = self.progress),
        onRefresh: (self) => (gallery.intro = self.progress),
      });

      const pin = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: () => `+=${last * window.innerHeight * 0.85}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (!gallery.dragging && !opening) gallery.target = self.progress * last;
          commit(Math.round(gallery.target));
          scheduleSnap();
        },
        onToggle: (self) => {
          if (self.isActive) pushHud(clamp(Math.round(gallery.target), 0, n - 1));
        },
        onLeaveBack: () => setHud(hud),
      });

      // Stay 1 px inside the pin at both ends so the first and last projects keep it active.
      const posFor = (i: number) => pin.start + 1 + (clamp(i, 0, last) / last) * Math.max(0, pin.end - pin.start - 2);
      const inRange = () => window.scrollY >= pin.start - 2 && window.scrollY <= pin.end + 2;

      const scrollToY = (y: number, duration: number, onComplete?: () => void) => {
        const lenis = getLenis();
        if (duration > 0) autoUntil = performance.now() + duration * 1000 + 50;
        if (lenis) {
          lenis.scrollTo(y, duration === 0 ? { immediate: true, force: true, onComplete } : { duration, easing: expoOut, force: true, onComplete });
        } else {
          window.scrollTo({ top: y, behavior: "instant" });
          onComplete?.();
        }
      };

      function commit(i: number) {
        const next = clamp(i, 0, n - 1);
        if (next === shown) return;
        shown = next;
        setIndex(next);
        if (inRange()) pushHud(next);
      }

      function scheduleSnap() {
        window.clearTimeout(snapTimer);
        snapTimer = window.setTimeout(() => {
          if (gallery.dragging || opening || !inRange()) return;
          if (performance.now() < autoUntil) {
            scheduleSnap();
            return;
          }
          const i = Math.round(gallery.target);
          if (Math.abs(gallery.target - i) > 0.004) scrollToY(posFor(i), 0.8);
        }, 160);
      }

      const goTo = (i: number) => {
        const next = clamp(i, 0, n - 1);
        scrollToY(posFor(next), 0.9 + Math.min(0.6, Math.abs(next - gallery.target) * 0.15));
      };

      const open = (i: number) => {
        if (opening) return;
        const item = items[i];
        if (!ready.current) {
          router.push(item.href);
          return;
        }
        opening = true;
        gallery.hover = -1;
        gsap.to(chrome, { autoAlpha: 0, duration: 0.4, ease: EASE.soft });
        gsap.to(label.current, { autoAlpha: 0, duration: 0.2 });
        const expand = () => {
          locked = true;
          lockScroll();
          gallery.target = i;
          gallery.expand.index = i;
          gsap.to(gallery.expand, {
            progress: 1,
            duration: 1.2,
            ease: EASE.inOut,
            onComplete: () => {
              writeHandoff(item.slug);
              router.push(item.href);
            },
          });
        };
        const y = posFor(i);
        if (Math.abs(window.scrollY - y) > 2 || Math.abs(gallery.current - i) > 0.02) {
          gallery.target = i;
          scrollToY(y, 0.7, expand);
        } else expand();
      };

      api.current = {
        goTo,
        open,
        focus: (i) => {
          if (Math.round(gallery.target) !== i) goTo(i);
        },
      };

      // Drag (mouse / pen / touch); scroll position stays the single source of truth for the index.
      const pxPerProject = () => {
        const layout = computeLayout(el.clientWidth / Math.max(1, el.clientHeight));
        return Math.max(1, el.clientWidth * layout.widthFraction * 1.1);
      };
      let down: { id: number; x: number; y: number; start: number; moved: boolean; ppp: number } | null = null;
      let samples: { t: number; v: number }[] = [];

      const pointerNdc = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        return {
          x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
          y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
          lx: event.clientX - rect.left,
          ly: event.clientY - rect.top,
        };
      };
      const hoverAt = (event: PointerEvent) => {
        const p = pointerNdc(event);
        const layout = computeLayout(el.clientWidth / Math.max(1, el.clientHeight));
        return { ...p, hit: hitTest(layout, p.x, p.y, gallery.display, n) };
      };

      const labelX = gsap.quickTo(label.current, "x", { duration: 0.45, ease: EASE.soft });
      const labelY = gsap.quickTo(label.current, "y", { duration: 0.45, ease: EASE.soft });
      let labelShown = false;
      let labelState = "";
      const setLabel = (state: "drag" | "open") => {
        if (state === labelState || !labelText.current) return;
        labelState = state;
        labelText.current.textContent = state === "open" ? copy.open : copy.drag;
        label.current?.setAttribute("data-state", state);
      };

      const onDown = (event: PointerEvent) => {
        if (opening || (event.pointerType === "mouse" && event.button !== 0)) return;
        down = { id: event.pointerId, x: event.clientX, y: event.clientY, start: gallery.target, moved: false, ppp: pxPerProject() };
        samples = [{ t: performance.now(), v: gallery.target }];
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType === "mouse" && !opening) {
          const h = hoverAt(event);
          gallery.hover = gallery.dragging ? -1 : h.hit;
          setLabel(h.hit >= 0 && !gallery.dragging ? "open" : "drag");
          if (!labelShown) {
            labelShown = true;
            gsap.set(label.current, { x: h.lx, y: h.ly });
            gsap.to(label.current, { autoAlpha: 1, scale: 1, duration: 0.35, ease: EASE.soft });
          }
          labelX(h.lx);
          labelY(h.ly);
        }
        if (!down || down.id !== event.pointerId) return;
        const dx = event.clientX - down.x;
        const dy = event.clientY - down.y;
        if (!down.moved) {
          if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy) || !inRange()) {
            if (Math.abs(dy) > 10) down = null;
            return;
          }
          down.moved = true;
          down.x = event.clientX;
          gallery.dragging = true;
          el.setPointerCapture(event.pointerId);
          el.style.cursor = "grabbing";
          label.current?.setAttribute("data-dragging", "true");
          return;
        }
        const raw = down.start - dx / down.ppp;
        const over = raw < 0 ? raw : raw > last ? raw - last : 0;
        gallery.target = clamp(raw, 0, last) + over * 0.3;
        const now = performance.now();
        samples.push({ t: now, v: gallery.target });
        while (samples.length > 2 && now - samples[0].t > 100) samples.shift();
        scrollToY(posFor(gallery.target), 0);
        commit(Math.round(gallery.target));
      };

      const onUp = (event: PointerEvent) => {
        if (!down || down.id !== event.pointerId) return;
        const wasMoved = down.moved;
        const down0 = down.start;
        down = null;
        if (wasMoved) {
          gallery.dragging = false;
          el.style.cursor = "";
          label.current?.removeAttribute("data-dragging");
          if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
          const a = samples[0];
          const b = samples[samples.length - 1];
          const dt = (b.t - a.t) / 1000;
          const v = dt > 0.01 ? (b.v - a.v) / dt : 0;
          const from = Math.round(down0);
          const delta = gallery.target + clamp(v, -8, 8) * 0.18 - from;
          goTo(Math.abs(delta) < 0.12 ? from : from + Math.sign(delta) * Math.max(1, Math.round(Math.abs(delta))));
          return;
        }
        if (event.type !== "pointerup") return;
        const h = hoverAt(event);
        if (h.hit < 0) return;
        if (h.hit === Math.round(gallery.display) || !inRange()) open(h.hit);
        else goTo(h.hit);
      };

      const onLeave = () => {
        gallery.hover = -1;
        labelShown = false;
        gsap.to(label.current, { autoAlpha: 0, scale: 0.6, duration: 0.25 });
      };

      const onWheel = (event: WheelEvent) => {
        if (opening || !inRange() || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        event.preventDefault();
        const lenis = getLenis();
        const current = lenis ? lenis.targetScroll : window.scrollY;
        scrollToY(clamp(current + event.deltaX * 1.4, pin.start, pin.end), 0);
      };

      const onKey = (event: KeyboardEvent) => {
        if (opening || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
        const target = event.target instanceof HTMLElement ? event.target : null;
        if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
        if (!inRange() && !el.contains(document.activeElement)) return;
        event.preventDefault();
        goTo(Math.round(gallery.target) + (event.key === "ArrowRight" ? 1 : -1));
      };

      const tick = (_time: number, deltaTime: number) => stepGallery(Math.min(deltaTime, 100) / 1000);

      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
      el.addEventListener("pointerleave", onLeave);
      el.addEventListener("wheel", onWheel, { passive: false });
      document.addEventListener("keydown", onKey);
      gsap.ticker.add(tick);
      ScrollTrigger.refresh();

      return () => {
        window.clearTimeout(snapTimer);
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        el.removeEventListener("pointerleave", onLeave);
        el.removeEventListener("wheel", onWheel);
        document.removeEventListener("keydown", onKey);
        gsap.ticker.remove(tick);
        gsap.killTweensOf(gallery.expand);
        intro.kill();
        pin.kill();
        api.current = null;
        gallery.dragging = false;
        if (locked) unlockScroll();
      };
    },
    { scope: stage, dependencies: [items, copy, hud, router] },
  );

  useGSAP(
    () => {
      const el = stage.current;
      if (!el) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          setVisible(entry.isIntersecting);
          if (entry.isIntersecting) setNear(true);
        },
        { rootMargin: "50% 0px" },
      );
      io.observe(el);
      return () => io.disconnect();
    },
    { scope: stage },
  );

  const item = items[index];
  return (
    <div
      ref={stage}
      role="region"
      aria-roledescription="carousel"
      aria-label={copy.aria}
      className="relative h-svh w-full cursor-grab touch-pan-y select-none overflow-hidden"
    >
      <div ref={canvasWrap} className="invisible absolute inset-0 opacity-0">
        {near && afterLoad && <GalleryCanvasLazy items={items} onReady={onReady} active={visible} />}
      </div>

      <div
        data-gallery-chrome
        className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-[max(4.5rem,8svh)] md:px-12"
      >
        <GalleryMeta item={item} index={index} count={count} copy={copy} />
      </div>
      <p
        data-gallery-chrome
        aria-hidden
        className="pointer-events-none absolute right-6 top-24 hidden rounded-sm bg-night/95 px-3 py-2 font-mono text-label uppercase text-cream md:right-12 md:block"
      >
        {copy.hint}
      </p>

      <p className="sr-only" aria-live="polite">
        {fill(copy.current, { index: index + 1, count, title: item.title })}
      </p>

      <nav aria-label={copy.listLabel} className="absolute inset-x-0 bottom-6 z-10 flex justify-center">
        <ol className="flex">
          {items.map((it, i) => (
            <li key={it.slug}>
              <Link
                href={it.href}
                aria-current={i === index ? "true" : undefined}
                onFocus={() => api.current?.focus(i)}
                onClick={(event) => {
                  if (!plainClick(event) || !api.current) return;
                  event.preventDefault();
                  api.current.open(i);
                }}
                className="sr-only rounded-full bg-cream px-6 py-3 font-mono text-label uppercase text-night focus-visible:not-sr-only focus-visible:inline-flex focus-visible:min-h-11 focus-visible:items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun"
              >
                {copy.open} — {it.title}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div
        ref={label}
        aria-hidden
        className="gallery-cursor pointer-events-none invisible absolute left-0 top-0 z-20 opacity-0 [@media(hover:none)]:hidden"
      >
        <span className="ml-5 mt-5 flex h-11 items-center gap-2 rounded-full border border-cream/25 bg-night/55 px-4 font-mono text-label uppercase text-cream backdrop-blur-md">
          <span aria-hidden className="text-sun">
            ←→
          </span>
          <span ref={labelText}>{copy.drag}</span>
        </span>
      </div>
    </div>
  );
}

function GalleryFallback({ items, copy, reduce }: SelectedWorkGalleryProps & { reduce: boolean }) {
  const router = useRouter();
  const list = useRef<HTMLOListElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useGSAP(
    () => {
      const ol = list.current;
      if (!ol) return;
      const cards = Array.from(ol.querySelectorAll<HTMLElement>("[data-card]"));
      let frame = 0;
      const update = () => {
        frame = 0;
        const box = ol.getBoundingClientRect();
        const mid = box.left + box.width / 2;
        let best = 0;
        let bestDist = Infinity;
        cards.forEach((card, i) => {
          const r = card.getBoundingClientRect();
          const offset = (r.left + r.width / 2 - mid) / box.width;
          if (Math.abs(offset) < bestDist) {
            bestDist = Math.abs(offset);
            best = i;
          }
          if (!reduce) {
            const o = clamp(offset, -1.2, 1.2);
            card.style.transform = `rotateY(${(-o * 16).toFixed(2)}deg) scale(${(1 - Math.abs(o) * 0.08).toFixed(3)})`;
          }
        });
        setIndex(best);
      };
      const onScroll = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      update();
      ol.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      return () => {
        cancelAnimationFrame(frame);
        ol.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    },
    { scope: list, dependencies: [reduce] },
  );

  const open = (event: ReactMouseEvent<HTMLAnchorElement>, it: GalleryItem) => {
    const box = overlay.current;
    const img = event.currentTarget.querySelector("img");
    if (reduce || !plainClick(event) || !box || !img) return;
    event.preventDefault();
    const r = img.getBoundingClientRect();
    box.style.backgroundImage = `url("${it.cover.src}")`;
    gsap.set(box, { autoAlpha: 1, top: r.top, left: r.left, width: r.width, height: r.height, borderRadius: 24 });
    lockScroll();
    gsap.to(box, {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      borderRadius: 0,
      duration: 0.9,
      ease: EASE.inOut,
      onComplete: () => {
        writeHandoff(it.slug);
        unlockScroll();
        router.push(it.href);
      },
    });
  };

  return (
    <div>
      <ol
        ref={list}
        aria-label={copy.aria}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[11vw] py-6 [perspective:1100px] [scrollbar-width:none] md:gap-8 md:px-[22vw] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it, i) => (
          <li key={it.slug} className="w-[78vw] shrink-0 snap-center md:w-[56vw]">
            <div data-card className="will-change-transform [transform-style:preserve-3d]">
              <Link
                href={it.href}
                onClick={(event) => open(event, it)}
                className="group block rounded-[1.5rem] outline-offset-4 focus-visible:outline-2 focus-visible:outline-sun"
              >
                <span className="relative block aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-umber shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] md:aspect-[3/2]">
                  <Image
                    src={it.cover.src}
                    alt={it.cover.alt}
                    fill
                    sizes="(max-width: 767px) 78vw, 56vw"
                    preload={i === 0}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
                  />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/0 to-night/0" />
                  <span className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 rounded-md bg-night/95 px-3 py-2">
                    <span className="text-h3 font-medium text-cream">{it.title}</span>
                    <span className="font-mono text-label text-sun">{pad(i + 1)}</span>
                  </span>
                </span>
                <span className="mt-4 flex w-fit flex-wrap gap-x-4 gap-y-1 rounded-sm bg-night/95 px-3 py-2 font-mono text-label uppercase text-cream">
                  <span>{it.category}</span>
                  <span>{it.year}</span>
                </span>
              </Link>
            </div>
          </li>
        ))}
      </ol>
      <p className="mx-auto mt-2 flex w-fit items-center justify-center gap-3 rounded-sm bg-night/95 px-3 py-2 font-mono text-label uppercase text-cream" aria-hidden>
        <span className="text-sun">
          {pad(index + 1)} / {pad(items.length)}
        </span>
        <span>{copy.swipe}</span>
      </p>
      <div
        ref={overlay}
        aria-hidden
        className="pointer-events-none invisible fixed z-[70] bg-night bg-cover bg-center opacity-0"
      />
    </div>
  );
}
