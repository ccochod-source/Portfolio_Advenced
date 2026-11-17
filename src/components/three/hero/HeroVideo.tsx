"use client";

import { useEffect, useRef, useState } from "react";
import { useAfterLoad } from "@/components/three/useAfterLoad";
import { getPreloadedHeroVideo, startSiteAssetLoad } from "@/lib/motion/assetLoader";
import { HERO_VIDEO_ASSETS as ASSETS, heroVideoFormatForViewport, type HeroVideoFormat as Format } from "@/lib/hero/assets";
import { VIDEO_ZOOM, getZoomProgress, subscribeZoom } from "@/lib/hero/zoom";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const FRAME_EPSILON = 1 / 48;

function targetTime(video: HTMLVideoElement, progress: number) {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return 0;
  return clamp01(progress / VIDEO_ZOOM.scrubEnd) * Math.max(0, video.duration - FRAME_EPSILON);
}

export function HeroVideo() {
  const afterLoad = useAfterLoad();
  const progressRef = useRef(0);
  const pointerTarget = useRef({ x: 0, y: 0 });
  const pointerCurrent = useRef({ x: 0, y: 0 });
  const [format, setFormat] = useState<Format>("16x9");
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [finePointer, setFinePointer] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const query = window.matchMedia("(max-aspect-ratio: 1/1)");
    const update = () => setFormat(heroVideoFormatForViewport());
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const sync = (next: number) => {
      progressRef.current = next;
      setProgress(next);
      if (next >= 0.05) {
        pointerTarget.current = { x: 0, y: 0 };
        pointerCurrent.current = { x: 0, y: 0 };
        setParallax({ x: 0, y: 0 });
      }
    };
    sync(getZoomProgress());
    return subscribeZoom(sync);
  }, []);

  useEffect(() => {
    if (!finePointer || reducedMotion !== false) return;
    let frame = 0;

    const tick = () => {
      frame = 0;
      if (document.hidden) return;
      const current = pointerCurrent.current;
      const target = pointerTarget.current;
      current.x += (target.x - current.x) * 0.14;
      current.y += (target.y - current.y) * 0.14;
      if (Math.abs(target.x - current.x) < 0.08 && Math.abs(target.y - current.y) < 0.08) {
        current.x = target.x;
        current.y = target.y;
      }
      setParallax({ x: current.x, y: current.y });
      if (current.x !== target.x || current.y !== target.y) frame = window.requestAnimationFrame(tick);
    };

    const schedule = () => {
      if (!frame && !document.hidden) frame = window.requestAnimationFrame(tick);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (progressRef.current >= 0.05) return;
      pointerTarget.current = {
        x: Math.max(-12, Math.min(12, (event.clientX / window.innerWidth - 0.5) * 24)),
        y: Math.max(-12, Math.min(12, (event.clientY / window.innerHeight - 0.5) * 24)),
      };
      schedule();
    };
    const reset = () => {
      pointerTarget.current = { x: 0, y: 0 };
      schedule();
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
      } else {
        schedule();
      }
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", reset);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", reset);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [finePointer, reducedMotion]);

  const asset = ASSETS[format];

  const motionAllowed = reducedMotion === false;
  const idleStrength = motionAllowed && finePointer ? clamp01(1 - progress / 0.05) : 0;
  const focus = VIDEO_ZOOM.focus[asset.focus];
  const zoomProgress = clamp01((progress - VIDEO_ZOOM.scrubEnd) / (1 - VIDEO_ZOOM.scrubEnd));
  const zoomScale = 1 + (focus.scale - 1) * zoomProgress * zoomProgress;
  const scale = progress >= VIDEO_ZOOM.scrubEnd ? zoomScale : 1 + 0.04 * idleStrength;
  const aspect = asset.width / asset.height;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
      <div
        data-hero-video=""
        data-video-format={format}
        className="relative flex-none"
        style={{
          width: `max(100vw, ${aspect * 100}svh)`,
          height: `max(100svh, ${100 / aspect}vw)`,
          aspectRatio: `${asset.width}/${asset.height}`,
          ...(motionAllowed
            ? {
                transformOrigin: `${focus.origin[0] * 100}% ${focus.origin[1] * 100}%`,
                transform: `translate3d(${parallax.x * idleStrength}px, ${parallax.y * idleStrength}px, 0) scale(${scale})`,
              }
            : {}),
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- high-priority decorative video poster */}
        <img
          src={asset.poster}
          alt=""
          width={asset.width}
          height={asset.height}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
        <HeroVideoFrame key={`${format}-${afterLoad}-${reducedMotion}`} format={format} afterLoad={afterLoad} reducedMotion={reducedMotion} />
      </div>
    </div>
  );
}

function HeroVideoFrame({
  format,
  afterLoad,
  reducedMotion,
}: {
  format: Format;
  afterLoad: boolean;
  reducedMotion: boolean | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(getZoomProgress());
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [loadedData, setLoadedData] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const asset = ASSETS[format];

  useEffect(() => {
    if (!afterLoad || reducedMotion !== false) return;
    const controller = new AbortController();
    let url: string | null = null;
    startSiteAssetLoad();
    getPreloadedHeroVideo(asset.video)
      .then((preloadedUrl) => {
        if (controller.signal.aborted) return;
        if (preloadedUrl) {
          setVideoSource(preloadedUrl);
          return null;
        }
        return fetch(asset.video, { signal: controller.signal, cache: "force-cache" }).then((response) => {
          if (!response.ok) throw new Error(`Hero video request failed (${response.status})`);
          return response.blob();
        });
      })
      .then((blob) => {
        if (!blob || controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setVideoSource(url);
      })
      .catch(() => {
        if (!controller.signal.aborted) setVideoSource(null);
      });

    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [afterLoad, asset.video, reducedMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSource || !loadedData || reducedMotion !== false) return;
    progressRef.current = getZoomProgress();
    let frame = 0;
    let active = true;

    const tick = () => {
      frame = 0;
      if (!active || document.hidden) return;
      if (video.seeking) {
        frame = window.requestAnimationFrame(tick);
        return;
      }
      const target = targetTime(video, progressRef.current);
      if (Math.abs(target - video.currentTime) > FRAME_EPSILON) {
        video.currentTime = target;
        frame = window.requestAnimationFrame(tick);
        return;
      }
      setFrameReady(true);
    };
    const schedule = () => {
      if (!frame && !document.hidden) frame = window.requestAnimationFrame(tick);
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
      } else {
        schedule();
      }
    };
    const unsubscribe = subscribeZoom((next) => {
      progressRef.current = next;
      schedule();
    });

    video.addEventListener("loadedmetadata", schedule);
    video.addEventListener("seeked", schedule);
    document.addEventListener("visibilitychange", onVisibilityChange);
    schedule();

    return () => {
      active = false;
      unsubscribe();
      video.removeEventListener("loadedmetadata", schedule);
      video.removeEventListener("seeked", schedule);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [loadedData, reducedMotion, videoSource]);

  if (!videoSource || reducedMotion !== false) return null;

  return (
    <video
      ref={videoRef}
      src={videoSource}
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      onLoadedData={() => setLoadedData(true)}
      className={`absolute inset-0 size-full object-cover transition-opacity duration-200 ${frameReady ? "opacity-100" : "opacity-0"}`}
    />
  );
}
