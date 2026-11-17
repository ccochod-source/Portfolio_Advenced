"use client";

import { useRef } from "react";
import { MEDIA } from "@/lib/motion/ease";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { whenPageRevealed } from "@/lib/motion/preloader";

type HeroTitleProps = {
  name: string;
  className?: string;
};

const gradient = "bg-gradient-to-b from-sun to-coral bg-clip-text text-transparent";

export function HeroTitle({ name, className = "" }: HeroTitleProps) {
  const root = useRef<HTMLHeadingElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const words = name.split(/(\s+)/);

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        const targets = letters.current.filter((letter): letter is HTMLSpanElement => letter !== null);
        const tween = gsap.fromTo(
          targets,
          {
            rotationY: 90,
            rotationX: -35,
            z: -180,
            filter: "blur(8px)",
            autoAlpha: 0,
            transformOrigin: "50% 50%",
          },
          {
            rotationY: 0,
            rotationX: 0,
            z: 0,
            filter: "blur(0px)",
            autoAlpha: 1,
            duration: 1.1,
            stagger: 0.035,
            ease: "expo.out",
            paused: true,
            onComplete: () => gsap.set(targets, { clearProps: "transform,filter,opacity,visibility" }),
          },
        );
        element.removeAttribute("data-motion-pending");
        const cancelWait = whenPageRevealed(() => tween.play(0));

        return () => {
          cancelWait();
          tween.kill();
        };
      });
    },
    { scope: root, dependencies: [name], revertOnUpdate: true },
  );

  let letterIndex = 0;

  return (
    <h1
      ref={root}
      aria-label={name}
      className={`hero-title hero-title-assembly ${className}`}
      data-motion-pending=""
    >
      {words.map((word, wordIndex) =>
        /^\s+$/.test(word) ? (
          <span key={`space-${wordIndex}`} aria-hidden="true">
            {word}
          </span>
        ) : (
          <span key={`word-${wordIndex}`} className="hero-title-word" aria-hidden="true">
            {Array.from(word).map((letter, index) => {
              const currentIndex = letterIndex++;
              return (
                <span
                  key={`${wordIndex}-${index}`}
                  ref={(node) => {
                    letters.current[currentIndex] = node;
                  }}
                  className={`hero-title-letter ${gradient}`}
                >
                  {letter}
                </span>
              );
            })}
          </span>
        ),
      )}
    </h1>
  );
}
