"use client";

import { useEffect, useId, useRef } from "react";
import { MEDIA } from "@/lib/motion/ease";
import { markPageRevealed, markPreloaderActive, PRELOADER_STORAGE_KEY } from "@/lib/motion/preloader";
import { lockScroll, unlockScroll } from "@/lib/motion/scroll";

const MIN_PROGRESS_MS = 2200;
const MAX_TOTAL_MS = 6000;
const EXIT_DURATION_MS = 800;

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 u_viewport;
uniform float u_pixelRatio;
uniform float u_time;
uniform float u_progress;
uniform float u_exit;
uniform vec2 u_pointer;
uniform vec2 u_pointerVelocity;
uniform float u_pulse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  return noise(p) * 0.67 + noise(p * 2.02 + vec2(17.1, 9.2)) * 0.33;
}

void main() {
  vec2 point = gl_FragCoord.xy / u_pixelRatio;
  float minDimension = min(u_viewport.x, u_viewport.y);
  float diagonal = length(u_viewport);
  vec2 center = u_viewport * 0.5 + u_pointer * (minDimension * 0.06);
  vec2 delta = point - center;
  float distanceFromCenter = length(delta);
  float angle = atan(delta.y, delta.x);
  float progress = clamp(u_progress, 0.0, 1.0);
  float grow = progress * progress;
  float baseRadius = mix(minDimension * 0.025, diagonal * 0.45, grow);

  float exitT = clamp(u_exit, 0.0, 1.0);
  float exitEase = exitT < 0.5
    ? 0.5 * exp2(20.0 * exitT - 10.0)
    : 1.0 - 0.5 * exp2(-20.0 * exitT + 10.0);
  baseRadius = mix(baseRadius, diagonal * 0.72, exitEase);

  float edgeNoise = fbm(vec2(cos(angle), sin(angle)) * 2.3 + vec2(u_time * 0.07, -u_time * 0.05));
  float petals = sin(angle * 5.0 + u_time * 0.22 + edgeNoise * 2.0) * 0.035
    + sin(angle * 3.0 - u_time * 0.17) * 0.025;
  float pointerDistance = length(u_pointer);
  float pointerAngle = atan(u_pointer.y, u_pointer.x);
  float angleDelta = atan(sin(angle - pointerAngle), cos(angle - pointerAngle));
  float pointerLobe = (1.0 - smoothstep(0.0, 0.75, abs(angleDelta)))
    * smoothstep(0.03, 0.16, pointerDistance);
  float motion = clamp(length(u_pointerVelocity), 0.0, 1.0);
  float bulge = pointerLobe * (0.02 + motion * 0.055);
  float radius = baseRadius * (1.0 + (edgeNoise - 0.5) * 0.20 + petals + bulge + u_pulse * 0.075);
  float edge = distanceFromCenter - radius;
  float antialias = max(0.75, 1.0 / u_pixelRatio);
  float inside = 1.0 - smoothstep(-antialias, antialias, edge);

  float grain = hash(floor(gl_FragCoord.xy * 0.5) + vec2(floor(u_time * 24.0))) - 0.5;
  vec3 outside = vec3(0.0431, 0.0235, 0.0157) + grain * 0.007;
  vec3 cream = vec3(1.0, 0.902, 0.769);
  vec3 color = outside;
  if (inside > 0.001) {
    vec2 p = delta / minDimension;
    vec2 warp = vec2(
      noise(p * 1.8 + vec2(u_time * 0.025, -u_time * 0.019)),
      noise(p * 1.8 + vec2(7.2, -3.6) + vec2(-u_time * 0.018, u_time * 0.022))
    );
    float field = fbm(p * 3.1 + warp * 1.65 + vec2(u_time * 0.035, -u_time * 0.028));
    float fold = sin((p.x + p.y * 0.35 + warp.x * 0.4) * 5.0 + field * 3.0 + u_time * 0.12);
    float ridges = pow(max(0.0, 1.0 - abs(fold - 0.08)), 7.0);
    float streaks = pow(max(0.0, cos(angle * 25.0 + field * 7.0 + u_time * 0.04)), 18.0)
      * (1.0 - smoothstep(radius * 0.35, radius * 0.95, distanceFromCenter));

    vec3 night = vec3(0.0784, 0.0431, 0.0275);
    vec3 umber = vec3(0.1412, 0.0784, 0.0471);
    vec3 ember = vec3(0.2902, 0.1412, 0.0706);
    vec3 silk = vec3(0.5412, 0.2431, 0.0941);
    vec3 interior = mix(night, umber, smoothstep(0.18, 0.72, field));
    interior = mix(interior, ember, smoothstep(0.40, 0.76, field + warp.x * 0.12) * 0.72);
    interior = mix(interior, silk, clamp(ridges * 0.42 + streaks * 0.14, 0.0, 0.42));
    interior += vec3(0.028, 0.014, 0.006) * streaks + grain * 0.024;
    color = mix(outside, interior, inside);
  }

  float aberration = 0.85 + motion * 2.8;
  float redFringe = exp(-pow((edge - aberration) / 1.25, 2.0));
  float greenFringe = exp(-pow(edge / 1.25, 2.0));
  float blueFringe = exp(-pow((edge + aberration) / 1.25, 2.0));
  float rimCore = exp(-pow(edge / 1.15, 2.0));
  float glow = exp(-abs(edge) / 8.0) * 0.28;
  color += cream * rimCore * 0.9;
  color += vec3(redFringe, greenFringe * 0.65, blueFringe * 0.4) * 0.22;
  color += vec3(1.0, 0.46, 0.18) * glow * 0.48;

  float interiorAlpha = mix(1.0, 1.0 - exitT, inside);
  float rimAlpha = clamp(rimCore * 0.92 + max(max(redFringe, greenFringe), blueFringe) * 0.12 + glow * 0.2, 0.0, 1.0);
  float alpha = max(interiorAlpha, rimAlpha);
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

type WebGLPortal = {
  gl: WebGLRenderingContext;
  uniforms: {
    viewport: WebGLUniformLocation | null;
    pixelRatio: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    progress: WebGLUniformLocation | null;
    exit: WebGLUniformLocation | null;
    pointer: WebGLUniformLocation | null;
    pointerVelocity: WebGLUniformLocation | null;
    pulse: WebGLUniformLocation | null;
  };
};

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function createPortal(canvas: HTMLCanvasElement): WebGLPortal | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: true,
    stencil: false,
  });
  if (!gl) return null;

  const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const buffer = gl.createBuffer();
  if (!buffer) {
    gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "a_position");
  if (position < 0) {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  return {
    gl,
    uniforms: {
      viewport: gl.getUniformLocation(program, "u_viewport"),
      pixelRatio: gl.getUniformLocation(program, "u_pixelRatio"),
      time: gl.getUniformLocation(program, "u_time"),
      progress: gl.getUniformLocation(program, "u_progress"),
      exit: gl.getUniformLocation(program, "u_exit"),
      pointer: gl.getUniformLocation(program, "u_pointer"),
      pointerVelocity: gl.getUniformLocation(program, "u_pointerVelocity"),
      pulse: gl.getUniformLocation(program, "u_pulse"),
    },
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hasIntroQuery() {
  try {
    return new URLSearchParams(window.location.search).has("intro");
  } catch {
    return false;
  }
}

export type PreloaderProps = {
  label?: string;
  skipHint?: string;
  duration?: number;
  force?: boolean;
  storageKey?: string;
  onComplete?: () => void;
};

function wasSeen(key: string) {
  try {
    return window.sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

function markSeen(key: string) {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Storage can be blocked: the preloader then plays on every load.
  }
}

export const PRELOADER_INERT_ID = "page";

export function Preloader({
  label,
  skipHint,
  duration = 2.2,
  force = false,
  storageKey = PRELOADER_STORAGE_KEY,
  onComplete,
}: PreloaderProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const callback = useRef(onComplete);

  useEffect(() => {
    callback.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const page = document.getElementById(PRELOADER_INERT_ID);
    const reduceQuery = window.matchMedia(MEDIA.reduce);
    const forced = force || hasIntroQuery();
    let finished = false;
    let locked = false;
    let exiting = false;
    let exitStartedAt = 0;
    let frame = 0;
    let portal: WebGLPortal | null = null;
    let pixelRatio = 1;
    let removeListeners = () => {};
    let posterGeneration = 0;
    let pageReady = document.readyState === "complete";
    let fontsReady = !document.fonts;
    let posterReady = false;
    let assetsReady = false;
    let holding = false;
    let progress = 0;
    let acceleratedElapsed = 0;
    let pulse = 0;
    let pulseVelocity = 0;
    let hiddenAt = 0;
    let pointerTarget = { x: 0, y: 0 };
    const pointerCurrent = { x: 0, y: 0 };
    const pointerVelocity = { x: 0, y: 0 };
    let pointerVelocityTarget = { x: 0, y: 0 };
    let lastPointer = { x: 0, y: 0, time: 0 };
    let startedAt = performance.now();
    let previousFrame = startedAt;

    const loseContext = () => {
      if (!portal) return;
      portal.gl.getExtension("WEBGL_lose_context")?.loseContext();
      portal = null;
    };

    const stopFrame = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      loseContext();
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      removeListeners();
      stopFrame();
      if (locked) {
        unlockScroll();
        locked = false;
      }
      page?.removeAttribute("inert");
      element.dataset.state = "done";
      markSeen(storageKey);
      markPageRevealed();
      callback.current?.();
    };

    const completeImmediately = () => finish();
    if (reduceQuery.matches || (!forced && wasSeen(storageKey))) {
      completeImmediately();
      return;
    }

    element.dataset.state = "active";
    page?.setAttribute("inert", "");
    markPreloaderActive();
    lockScroll();
    locked = true;
    startedAt = performance.now();
    previousFrame = startedAt;

    portal = canvas.current ? createPortal(canvas.current) : null;
    element.dataset.webgl = portal ? "true" : "false";

    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const resize = () => {
      viewport.width = window.innerWidth;
      viewport.height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, window.matchMedia("(max-width: 767px)").matches ? 1.25 : 1.5);
      if (!portal) return;
      const width = Math.max(1, Math.round(viewport.width * pixelRatio));
      const height = Math.max(1, Math.round(viewport.height * pixelRatio));
      if (canvas.current) {
        canvas.current.width = width;
        canvas.current.height = height;
      }
      portal.gl.viewport(0, 0, width, height);
      portal.gl.uniform2f(portal.uniforms.viewport, viewport.width, viewport.height);
      portal.gl.uniform1f(portal.uniforms.pixelRatio, pixelRatio);
    };
    resize();

    const updateAssetsReady = () => {
      if (pageReady && fontsReady && posterReady) assetsReady = true;
    };
    const decodePoster = async () => {
      const generation = ++posterGeneration;
      posterReady = false;
      const mobile = window.matchMedia("(max-aspect-ratio: 1/1)").matches;
      const image = new Image();
      image.src = mobile ? "/hero/hero-zoom-9x16.webp" : "/hero/hero-zoom-16x9.webp";
      let decoded = false;
      try {
        if (image.decode) {
          await image.decode();
        } else {
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error("Hero poster could not be loaded"));
          });
        }
        decoded = true;
      } catch {
        decoded = false;
      }
      if (generation !== posterGeneration) return;
      posterReady = decoded;
      updateAssetsReady();
    };

    const onPageLoad = () => {
      pageReady = true;
      updateAssetsReady();
    };
    const onFontsReady = () => {
      fontsReady = true;
      updateAssetsReady();
    };
    const onFormatChange = () => {
      if (!assetsReady) void decodePoster();
    };
    const aspectQuery = window.matchMedia("(max-aspect-ratio: 1/1)");
    const onReducedMotion = () => {
      if (reduceQuery.matches) finish();
    };

    if (!pageReady) window.addEventListener("load", onPageLoad, { once: true });
    if (document.fonts) void document.fonts.ready.then(onFontsReady, onFontsReady);
    void decodePoster();
    aspectQuery.addEventListener("change", onFormatChange);
    reduceQuery.addEventListener("change", onReducedMotion);

    const startExit = (now: number) => {
      if (exiting || finished) return;
      exiting = true;
      progress = 1;
      if (counter.current) counter.current.textContent = "100";
      exitStartedAt = now;
      element.dataset.state = "exiting";
      markPageRevealed();
    };

    const onPointerMove = (event: PointerEvent) => {
      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      pointerTarget = {
        x: clamp((event.clientX / width - 0.5) * 2, -1, 1),
        y: clamp((0.5 - event.clientY / height) * 2, -1, 1),
      };
      const now = performance.now();
      if (lastPointer.time > 0) {
        const deltaTime = Math.max(0.008, (now - lastPointer.time) / 1000);
        pointerVelocityTarget = {
          x: clamp(((event.clientX - lastPointer.x) / width / deltaTime) * 0.35, -1, 1),
          y: clamp((-(event.clientY - lastPointer.y) / height / deltaTime) * 0.35, -1, 1),
        };
      }
      lastPointer = { x: event.clientX, y: event.clientY, time: now };
    };
    const onPointerDown = (event: PointerEvent) => {
      holding = true;
      pulseVelocity += 4.5;
      onPointerMove(event);
    };
    const onPointerUp = () => {
      holding = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") {
        event.preventDefault();
        startExit(performance.now());
      } else if (event.code === "Space") {
        event.preventDefault();
        holding = true;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") holding = false;
    };
    const onBlur = () => {
      holding = false;
      pointerTarget = { x: 0, y: 0 };
      pointerVelocityTarget = { x: 0, y: 0 };
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (!hiddenAt) hiddenAt = performance.now();
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
      } else if (!finished && !frame) {
        const resumedAt = performance.now();
        if (hiddenAt) {
          const pausedFor = resumedAt - hiddenAt;
          startedAt += pausedFor;
          if (exiting) exitStartedAt += pausedFor;
          hiddenAt = 0;
        }
        previousFrame = resumedAt;
        frame = window.requestAnimationFrame(render);
      }
    };
    const onResize = () => resize();

    removeListeners = () => {
      window.removeEventListener("load", onPageLoad);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      aspectQuery.removeEventListener("change", onFormatChange);
      reduceQuery.removeEventListener("change", onReducedMotion);
    };

    const render = (now: number) => {
      frame = 0;
      if (finished || document.hidden) return;
      const frameDelta = Math.max(0, (now - previousFrame) / 1000);
      const dt = Math.min(frameDelta, 0.05);
      previousFrame = now;

      if (!exiting) {
        acceleratedElapsed += frameDelta * 1000 * (holding ? 2.5 : 1);
        const minimumDuration = clamp(duration * 1000, MIN_PROGRESS_MS, MAX_TOTAL_MS - EXIT_DURATION_MS);
        const timeTarget = clamp(acceleratedElapsed / minimumDuration, 0, 1);
        const target = Math.min(assetsReady ? 1 : 0.9, timeTarget);
        progress += (target - progress) * (1 - Math.exp(-frameDelta * 8));
        progress = Math.max(0, progress);

        const elapsed = now - startedAt;
        const maxWait = MAX_TOTAL_MS - EXIT_DURATION_MS;
        if ((assetsReady && elapsed >= minimumDuration && progress >= 0.98) || elapsed >= maxWait) {
          startExit(now);
        }
      }

      const exitProgress = exiting ? clamp((now - exitStartedAt) / EXIT_DURATION_MS, 0, 1) : 0;
      const pointerEase = 1 - Math.exp(-dt * 4.5);
      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * pointerEase;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * pointerEase;
      const velocityAge = lastPointer.time ? Math.max(0, (now - lastPointer.time) / 1000) : 1;
      const velocityDecay = Math.exp(-velocityAge * 5);
      pointerVelocity.x += (pointerVelocityTarget.x * velocityDecay - pointerVelocity.x) * pointerEase;
      pointerVelocity.y += (pointerVelocityTarget.y * velocityDecay - pointerVelocity.y) * pointerEase;
      pulseVelocity += (-pulse * 38 - pulseVelocity * 9) * dt;
      pulse = clamp(pulse + pulseVelocity * dt, 0, 1);

      const minDimension = Math.min(viewport.width, viewport.height);
      const radius = minDimension * 0.025 + (Math.hypot(viewport.width, viewport.height) * 0.45 - minDimension * 0.025) * progress * progress;
      const exitEase = exitProgress < 0.5
        ? 0.5 * 2 ** (20 * exitProgress - 10)
        : 1 - 0.5 * 2 ** (-20 * exitProgress + 10);
      const portalRadius = exiting
        ? radius + (Math.hypot(viewport.width, viewport.height) * 0.72 - radius) * exitEase
        : radius;

      element.style.setProperty("--portal-diameter", `${portalRadius * 2}px`);
      element.style.setProperty("--preloader-exit", String(exitProgress));
      element.style.setProperty("--preloader-content-opacity", String(1 - exitProgress));
      if (!exiting && counter.current) {
        counter.current.textContent = String(Math.min(99, Math.floor(progress * 100))).padStart(2, "0");
      }

      if (portal) {
        const gl = portal.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(portal.uniforms.time, (now - startedAt) / 1000);
        gl.uniform1f(portal.uniforms.progress, progress);
        gl.uniform1f(portal.uniforms.exit, exitProgress);
        gl.uniform2f(portal.uniforms.pointer, pointerCurrent.x, pointerCurrent.y);
        gl.uniform2f(portal.uniforms.pointerVelocity, pointerVelocity.x, pointerVelocity.y);
        gl.uniform1f(portal.uniforms.pulse, pulse);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      if (exiting && exitProgress >= 1) {
        finish();
        return;
      }
      frame = window.requestAnimationFrame(render);
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    frame = window.requestAnimationFrame(render);

    return () => {
      removeListeners();
      stopFrame();
      if (!finished) {
        page?.removeAttribute("inert");
        if (locked) unlockScroll();
      }
    };
  }, [duration, force, storageKey]);

  const script = `(function(){var e=document.getElementById(${JSON.stringify(id)}),s=false,q=false;try{s=sessionStorage.getItem(${JSON.stringify(storageKey)})!==null}catch(_){}try{q=new URLSearchParams(location.search).has("intro")}catch(_){}if(matchMedia(${JSON.stringify(MEDIA.reduce)}).matches||(!${force ? "true" : "false"}&&!q&&s)){if(e)e.setAttribute("data-state","done");window.__preloader="done"}else{window.__preloader="active"}})()`;

  return (
    <>
      <div ref={root} id={id} aria-hidden className="preloader" data-state="pending" suppressHydrationWarning>
        <canvas ref={canvas} className="preloader-canvas" />
        <div className="preloader-fallback" aria-hidden>
          <span className="preloader-fallback-blob" />
        </div>
        <div data-preloader-content className="preloader-content">
          <div data-preloader-meta className="preloader-meta font-mono text-label uppercase">
            <span>{label}</span>
            <span className="text-right opacity-70">{skipHint}</span>
          </div>
          <span ref={counter} className="preloader-counter font-mono text-label tabular-nums">
            00
          </span>
        </div>
      </div>
      <script
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: script }}
      />
    </>
  );
}
