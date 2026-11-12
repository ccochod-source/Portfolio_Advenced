"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { MEDIA } from "@/lib/motion/ease";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { getLenis, scrollTo, setLenis } from "@/lib/motion/scroll";

export { scrollTo, lockScroll, unlockScroll } from "@/lib/motion/scroll";

type SmoothScrollProps = {
  children: ReactNode;
  /** Extra px added to every anchor scroll, on top of the CSS `--scroll-offset` (fixed nav clearance). */
  offset?: number;
};

/** Same-page link with a hash that resolves to an element (or `#top`). */
function inPageTarget(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
  if (!link || link.target === "_blank" || link.hasAttribute("download") || link.hasAttribute("data-native-scroll")) {
    return null;
  }
  const url = new URL(link.href, window.location.href);
  const here = window.location;
  if (url.origin !== here.origin || url.pathname !== here.pathname || url.search !== here.search || !url.hash) {
    return null;
  }
  return url.hash;
}

function useLenis() {
  useEffect(() => {
    const reduce = window.matchMedia(MEDIA.reduce);
    let teardown = () => {};

    const setup = () => {
      teardown();
      teardown = () => {};
      if (reduce.matches) return;

      const lenis = new Lenis({ stopInertiaOnNavigate: true });
      setLenis(lenis);
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      teardown = () => {
        gsap.ticker.remove(tick);
        setLenis(null);
        lenis.destroy();
      };
    };

    setup();
    reduce.addEventListener("change", setup);
    return () => {
      reduce.removeEventListener("change", setup);
      teardown();
    };
  }, []);
}

/** Re-measures Lenis and ScrollTrigger when the page height changes (images, fonts, accordions…). */
function useLayoutSync() {
  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
    let measured = document.documentElement.scrollHeight;
    let timeout = 0;

    const remember = () => {
      measured = document.documentElement.scrollHeight;
      getLenis()?.resize();
    };
    const sync = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        // <html> is `h-full`, so Lenis' own observer never sees the content grow.
        getLenis()?.resize();
        if (Math.abs(document.documentElement.scrollHeight - measured) >= 2) ScrollTrigger.refresh();
      }, 200);
    };

    ScrollTrigger.addEventListener("refresh", remember);
    const observer = new ResizeObserver(sync);
    observer.observe(document.body);
    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
      ScrollTrigger.removeEventListener("refresh", remember);
    };
  }, []);
}

function useAnchorLinks(offset: number) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const hash = inPageTarget(event);
      if (!hash) return;
      const scrolled = scrollTo(hash, { offset });
      if (!scrolled) return;
      // Next's <Link> ignores clicks that are already default-prevented.
      event.preventDefault();
      if (hash !== window.location.hash) window.history.pushState(null, "", hash);
    };
    window.addEventListener("click", onClick, { capture: true });
    return () => window.removeEventListener("click", onClick, { capture: true });
  }, [offset]);
}

/** Re-measures Lenis and ScrollTrigger after a client-side navigation. */
function RouteSync() {
  const pathname = usePathname();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      getLenis()?.resize();
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  return null;
}

export function SmoothScroll({ children, offset = 0 }: SmoothScrollProps) {
  useLenis();
  useLayoutSync();
  useAnchorLinks(offset);

  return (
    <>
      <Suspense fallback={null}>
        <RouteSync />
      </Suspense>
      {children}
    </>
  );
}
