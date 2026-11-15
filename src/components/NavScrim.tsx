"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ZOOM, getZoomProgress, subscribeZoom } from "@/lib/hero/zoom";

export function NavScrim() {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const rect = document.getElementById("hero")?.getBoundingClientRect();
      const postHero = !!rect && rect.height > 0 && (getZoomProgress() >= ZOOM.handoverStart || rect.bottom <= 80);
      el.style.setProperty("--nav-post-hero", postHero ? "1" : "0");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    sync();
    const unsubscribe = subscribeZoom(schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      unsubscribe();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 bg-gradient-to-b from-night/90 via-night/75 to-transparent md:-top-5"
    >
      <div
        className="absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none md:hidden"
        style={{
          opacity: "var(--nav-post-hero, 0)",
          background: "linear-gradient(to bottom, var(--color-night) 0%, var(--color-night) 55%, transparent 100%)",
        }}
      />
    </div>
  );
}
