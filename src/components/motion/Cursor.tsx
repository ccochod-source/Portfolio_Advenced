"use client";

import { useRef } from "react";
import { MEDIA } from "@/lib/motion/ease";
import { gsap, useGSAP } from "@/lib/motion/gsap";

export type CursorProps = {
  /** Text shown inside the ring over `[data-cursor="view"]`; a `data-cursor-label` on the element overrides it. */
  label?: string;
};

const ACTIVE_CLASS = "has-custom-cursor";
const NATIVE_CURSOR = "a, button, input, textarea, select, label, summary, [role='button']";

/**
 * Decorative dot + ring following the pointer. Mouse/trackpad only, off with reduced motion.
 * The native cursor stays on links, buttons and form fields; it is only replaced over
 * `[data-cursor="view"]` zones, where the ring grows and shows the label.
 */
export function Cursor({ label = "" }: CursorProps) {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(`${MEDIA.fine} and ${MEDIA.motion}`, () => {
        const html = document.documentElement;
        const container = root.current;
        if (!container || !text.current) return;
        const labelNode = text.current;
        let visible = false;

        gsap.set([dot.current, ring.current], { xPercent: -50, yPercent: -50 });
        const dotX = gsap.quickTo(dot.current, "x", { duration: 0.12, ease: "power3.out" });
        const dotY = gsap.quickTo(dot.current, "y", { duration: 0.12, ease: "power3.out" });
        const ringX = gsap.quickTo(ring.current, "x", { duration: 0.5, ease: "power3.out" });
        const ringY = gsap.quickTo(ring.current, "y", { duration: 0.5, ease: "power3.out" });

        const move = (event: PointerEvent) => {
          if (event.pointerType === "touch") return;
          if (!visible) {
            visible = true;
            html.classList.add(ACTIVE_CLASS);
            gsap.set([dot.current, ring.current], { x: event.clientX, y: event.clientY });
            gsap.to(container, { autoAlpha: 1, duration: 0.3 });
          }
          dotX(event.clientX);
          dotY(event.clientY);
          ringX(event.clientX);
          ringY(event.clientY);
        };

        const over = (event: PointerEvent) => {
          const element = event.target instanceof Element ? event.target : null;
          const view = element?.closest<HTMLElement>('[data-cursor="view"]');
          if (view) {
            labelNode.textContent = view.dataset.cursorLabel ?? label;
            container.dataset.state = "view";
          } else {
            container.dataset.state = element?.closest(NATIVE_CURSOR) ? "hover" : "idle";
          }
        };

        const hide = () => {
          visible = false;
          gsap.to(container, { autoAlpha: 0, duration: 0.2 });
        };

        window.addEventListener("pointermove", move, { passive: true });
        document.addEventListener("pointerover", over, { passive: true });
        html.addEventListener("pointerleave", hide);

        return () => {
          window.removeEventListener("pointermove", move);
          document.removeEventListener("pointerover", over);
          html.removeEventListener("pointerleave", hide);
          html.classList.remove(ACTIVE_CLASS);
          container.dataset.state = "idle";
        };
      });
    },
    { scope: root, dependencies: [label], revertOnUpdate: true },
  );

  return (
    <div ref={root} aria-hidden data-state="idle" className="motion-cursor">
      <span ref={ring} className="motion-cursor-ring">
        <span ref={text} className="motion-cursor-label" />
      </span>
      <span ref={dot} className="motion-cursor-dot" />
    </div>
  );
}
