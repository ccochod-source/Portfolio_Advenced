"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getZoomProgress, subscribeZoom } from "@/lib/hero/zoom";
import { resetHud, setHud, useHud } from "@/lib/hud/store";

const HUD_ATTRIBUTES = "[data-hud-left], [data-hud-center], [data-hud-right]";
/** Content that must never sit under the bar: the HUD hides once such an element reaches the bottom band, and stays hidden below it. */
const HUD_STOP = "[data-hud-stop]";
const HUD_BAND_PX = 96;

export function HudBar() {
  const hud = useHud();
  const pathname = usePathname();
  const [zoomComplete, setZoomComplete] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const hasContent = Boolean(hud.left || hud.center || hud.right);

  useEffect(() => {
    const update = () => {
      setZoomComplete(!document.getElementById("hero") || getZoomProgress() >= 1);
    };
    update();
    const unsubscribe = subscribeZoom(update);
    return unsubscribe;
  }, [pathname]);

  useEffect(() => {
    resetHud();
    const markers = Array.from(document.querySelectorAll<HTMLElement>(HUD_ATTRIBUTES));
    if (!markers.length || typeof IntersectionObserver === "undefined") return;

    const visible = new Map<HTMLElement, IntersectionObserverEntry>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            visible.set(entry.target as HTMLElement, entry);
          } else {
            visible.delete(entry.target as HTMLElement);
          }
        }
        const active = Array.from(visible.values()).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]?.target as HTMLElement | undefined;
        if (!active) {
          resetHud();
          return;
        }
        setHud({
          left: active.dataset.hudLeft ?? "",
          center: active.dataset.hudCenter ?? "",
          right: active.dataset.hudRight ?? "",
        });
      },
      { threshold: [0.5] },
    );

    markers.forEach((marker) => observer.observe(marker));
    return () => {
      observer.disconnect();
      resetHud();
    };
  }, [pathname]);

  useEffect(() => {
    const stops = Array.from(document.querySelectorAll<HTMLElement>(HUD_STOP));
    if (!stops.length || typeof IntersectionObserver === "undefined") return;

    const reached = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const above = entry.rootBounds ? entry.boundingClientRect.bottom <= entry.rootBounds.top : false;
          if (entry.isIntersecting || above) reached.add(entry.target);
          else reached.delete(entry.target);
        }
        setBlocked(reached.size > 0);
      },
      { rootMargin: `0px 0px -${HUD_BAND_PX}px 0px`, threshold: 0 },
    );

    stops.forEach((stop) => observer.observe(stop));
    return () => {
      observer.disconnect();
      setBlocked(false);
    };
  }, [pathname]);

  return (
    <div className="hud-bar" data-visible={zoomComplete && hasContent && !blocked} aria-hidden="true">
      <span>{hud.left}</span>
      <span>{hud.center}</span>
      <span>{hud.right}</span>
    </div>
  );
}
