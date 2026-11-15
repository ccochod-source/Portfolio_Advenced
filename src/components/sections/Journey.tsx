"use client";

import { useRef } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { JourneyStep } from "@/content/journey";
import { profile } from "@/content/profile";
import { t } from "@/content/types";
import type { Locale } from "@/i18n";
import { AVATAR_ANCHORS } from "@/lib/avatar/story";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import "./journey.css";

export type JourneyProps = {
  lang: Locale;
  copy: Dictionary["journey"];
  hud: Dictionary["hud"]["sections"]["journey"];
  steps: JourneyStep[];
  id?: string;
  index?: string;
};

/** Scroll distance of the pinned timeline, in viewport heights. */
const HUD_CENTER = `${profile.name.toUpperCase()} — PORTFOLIO`;
const PIN_LENGTH = 3.2;
/** Share of each step-to-step stretch spent standing at a step (the avatar stops, the step reads). */
const DWELL = 0.38;
/** Pinned progress before the first move and after the last arrival. */
const LEAD = 0.05;
const TAIL = 0.16;

const DESKTOP_MOTION = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const MOBILE_MOTION = "(max-width: 1023px) and (prefers-reduced-motion: no-preference)";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);
const pad = (n: number) => String(n).padStart(2, "0");

/** Pinned scroll progress (0..1) → position along the steps (0..count-1), easing out of and into every step. */
function stepPosition(progress: number, count: number) {
  const stretches = count - 1;
  const scaled = clamp01((progress - LEAD) / (1 - LEAD - TAIL)) * stretches;
  const k = Math.min(stretches - 1, Math.floor(scaled));
  const local = scaled - k;
  return k + smooth(clamp01((local - DWELL / 2) / (1 - DWELL)));
}

/** "Septembre 2027" → big "2027" + small "Septembre"; words without a year stay whole. */
function splitYear(year: string) {
  const match = year.match(/\d{4}/);
  if (!match) return { big: year, small: null, word: true };
  return {
    big: match[0],
    small: year.replace(match[0], "").trim() || null,
    word: false,
  };
}

export function Journey({ lang, copy, hud, steps, id = "parcours", index = "05" }: JourneyProps) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const total = pad(steps.length);
  // HUD markers sit on the head and each step: the section itself is too tall (pinned / stacked) to be 50 % in view.
  const hudAttrs = {
    "data-hud-left": hud.left,
    "data-hud-center": HUD_CENTER,
    "data-hud-right": hud.right,
  };

  useGSAP(
    () => {
      const section = root.current;
      const pinned = stage.current;
      const list = track.current;
      if (!section || !pinned || !list) return;
      const items = Array.from(list.querySelectorAll<HTMLElement>("[data-journey-step]"));
      const count = items.length;
      if (count < 2) return;

      let active = -1;
      const activate = (i: number) => {
        if (i === active) return;
        active = i;
        items.forEach((item, j) => item.toggleAttribute("data-active", j === i));
        if (counter.current) counter.current.textContent = pad(i + 1);
      };

      const mm = gsap.matchMedia();

      mm.add(DESKTOP_MOTION, () => {
        section.dataset.journeyMotion = "pin";
        let heads: number[] = [];
        let width = 1;
        let progress = 0;
        const measure = () => {
          heads = items.map((item) => item.offsetLeft);
          width = Math.max(1, list.clientWidth);
        };
        const apply = (p: number) => {
          progress = p;
          const pos = stepPosition(p, count);
          const k = Math.min(count - 2, Math.floor(pos));
          const x = heads[k] + (heads[k + 1] - heads[k]) * (pos - k);
          // After the last arrival the line keeps running to the edge, towards what comes next.
          const tail = clamp01((p - (1 - TAIL)) / TAIL);
          pinned.style.setProperty("--journey-head", `${x.toFixed(1)}px`);
          pinned.style.setProperty("--journey-fill", ((x + (width - x) * smooth(tail)) / width).toFixed(4));
          items.forEach((item, i) => item.toggleAttribute("data-reached", pos >= i - 0.08));
          activate(Math.round(pos));
        };
        measure();
        apply(0);

        const trigger = ScrollTrigger.create({
          trigger: pinned,
          start: "top top",
          end: () => `+=${window.innerHeight * PIN_LENGTH}`,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => apply(self.progress),
          onRefresh: (self) => {
            measure();
            apply(self.progress ?? progress);
          },
        });

        return () => {
          trigger.kill();
          delete section.dataset.journeyMotion;
          pinned.style.removeProperty("--journey-head");
          pinned.style.removeProperty("--journey-fill");
          items.forEach((item) => {
            item.removeAttribute("data-reached");
            item.removeAttribute("data-active");
          });
          active = -1;
        };
      });

      mm.add(MOBILE_MOTION, () => {
        section.dataset.journeyMotion = "scroll";
        const fill = ScrollTrigger.create({
          trigger: list,
          start: "top 72%",
          end: "bottom 72%",
          onUpdate: (self) => pinned.style.setProperty("--journey-fill", self.progress.toFixed(4)),
        });
        const reveals = items.map((item, i) =>
          ScrollTrigger.create({
            trigger: item,
            start: "top 78%",
            onEnter: () => {
              item.setAttribute("data-reached", "");
              activate(i);
            },
            onLeaveBack: () => {
              item.removeAttribute("data-reached");
              activate(Math.max(0, i - 1));
            },
          }),
        );
        return () => {
          fill.kill();
          reveals.forEach((r) => r.kill());
          delete section.dataset.journeyMotion;
          pinned.style.removeProperty("--journey-fill");
          items.forEach((item) => {
            item.removeAttribute("data-reached");
            item.removeAttribute("data-active");
          });
          active = -1;
        };
      });

      return () => mm.revert();
    },
    { scope: root, dependencies: [total] },
  );

  return (
    <section ref={root} id={id} aria-labelledby={`${id}-title`} className="journey relative">
      <div ref={stage} className="journey-stage">
        <Container className="journey-head" {...hudAttrs}>
          <div className="max-w-3xl">
            <Eyebrow index={index} className="text-cream-dim">
              {copy.eyebrow}
            </Eyebrow>
            <h2 id={`${id}-title`} className="mt-5 text-h2 font-medium text-cream">
              {copy.title}
            </h2>
            <p className="mt-5 max-w-xl text-cream-muted md:text-lg">{copy.lead}</p>
          </div>
          <p aria-hidden className="journey-counter">
            <span ref={counter}>01</span>
            <span className="text-cream-dim"> / {total}</span>
          </p>
        </Container>

        <Container className="journey-rail">
          <div ref={track} id="journey-track" className="journey-track">
            <div aria-hidden className="journey-line">
              <span className="journey-line-fill" />
              <span className="journey-line-head" />
            </div>
            <div aria-hidden data-avatar-anchor={AVATAR_ANCHORS.journey} className="journey-anchor" />
            <ol className="journey-steps">
              {steps.map((step, i) => {
                const year = splitYear(t(step.year, lang));
                return (
                  <li key={step.id} {...hudAttrs} data-journey-step={step.id} data-open={step.open || undefined} className="journey-step">
                    <span aria-hidden className="journey-dot" />
                    <p aria-hidden className={`journey-year ${year.word ? "journey-year-word" : ""}`}>
                      {year.big}
                    </p>
                    <div className="journey-body">
                      <p className="font-mono text-label uppercase text-cream-dim">
                        <span className="text-gold">{pad(i + 1)}</span> · {t(step.year, lang)}
                      </p>
                      <p className="mt-2 font-mono text-label uppercase text-cream-dim">{t(step.place, lang)}</p>
                      <h3 className="journey-title">{t(step.title, lang)}</h3>
                      <p className="journey-text">{t(step.text, lang)}</p>
                      {step.open && (
                        <div className="journey-cta">
                          <p className="journey-open">
                            <span aria-hidden className="journey-open-dot" />
                            {copy.open}
                          </p>
                          <Button href={`/${lang}#contact`} arrow className="journey-cta-button">
                            {copy.cta}
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </Container>
      </div>
    </section>
  );
}
