import type Lenis from "lenis";

export type ScrollTarget = string | number | HTMLElement;

export type ScrollToOptions = {
  /** Extra offset in px, added on top of the target's `scroll-margin-top`. */
  offset?: number;
  immediate?: boolean;
  duration?: number;
  /** Move keyboard focus to the target once the scroll ends (default true for elements). */
  focus?: boolean;
  onComplete?: () => void;
};

const LOCK_CLASS = "motion-scroll-lock";
let lenis: Lenis | null = null;
let locks = 0;

export function getLenis() {
  return lenis;
}

export function setLenis(instance: Lenis | null) {
  lenis = instance;
  if (lenis && locks > 0) lenis.stop();
}

function resolveTarget(target: ScrollTarget): HTMLElement | number | null {
  if (typeof target !== "string") return target;
  if (target === "#" || target === "#top" || target === "top") return 0;
  if (target.startsWith("#")) {
    return document.getElementById(decodeURIComponent(target.slice(1)));
  }
  return document.querySelector<HTMLElement>(target);
}

function focusTarget(element: HTMLElement) {
  if (!element.hasAttribute("tabindex") && element.tabIndex < 0) {
    element.setAttribute("tabindex", "-1");
  }
  element.focus({ preventScroll: true });
}

/** Scrolls to an anchor (`"#projets"`), element or y position, with Lenis when active. Returns false if the target is missing. */
export function scrollTo(target: ScrollTarget, options: ScrollToOptions = {}) {
  const resolved = resolveTarget(target);
  if (resolved === null) return false;
  const { offset = 0, immediate = false, duration, focus = true, onComplete } = options;
  const done = () => {
    if (focus && resolved instanceof HTMLElement) focusTarget(resolved);
    onComplete?.();
  };

  if (lenis) {
    lenis.resize();
    lenis.scrollTo(resolved, { offset, immediate, duration, force: true, onComplete: done });
    return true;
  }

  let top = 0;
  if (typeof resolved === "number") {
    top = resolved;
  } else {
    const margin = Number.parseFloat(getComputedStyle(resolved).scrollMarginTop) || 0;
    top = resolved.getBoundingClientRect().top + window.scrollY - margin;
  }
  window.scrollTo({ top: top + offset, behavior: "instant" });
  done();
  return true;
}

/** Blocks page scroll (Lenis and native). Calls are counted: pair each with `unlockScroll()`. */
export function lockScroll() {
  locks += 1;
  document.documentElement.classList.add(LOCK_CLASS);
  lenis?.stop();
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;
  document.documentElement.classList.remove(LOCK_CLASS);
  lenis?.start();
}
