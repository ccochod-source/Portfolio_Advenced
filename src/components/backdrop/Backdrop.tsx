"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ZOOM, getZoomProgress, subscribeZoom } from "@/lib/hero/zoom";

type SymbolArtworkName = "enso" | "lotus" | "flower-of-life" | "unalome" | "mandala";

function SymbolArtwork({
  name,
  width,
  height,
}: {
  name: SymbolArtworkName;
  width: number;
  height: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-cut decorative WebP artwork
    <img
      src={`/textures/symbols/${name}.webp`}
      alt=""
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function zoomFade(progress: number) {
  return clamp01((progress - ZOOM.handoverStart) / (1 - ZOOM.handoverStart));
}

function scrollFade(hero: HTMLElement | null) {
  if (!hero) return 1;
  const bottom = hero.getBoundingClientRect().bottom;
  return clamp01((window.innerHeight - bottom) / (window.innerHeight * 0.5));
}

const vertexSource = /* glsl */ `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentSource = /* glsl */ `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_mouseStrength;
  uniform float u_time;
  varying vec2 v_uv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 rotation = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = rotation * p * 2.03 + 11.7;
      amplitude *= 0.49;
    }
    return value;
  }

  float fabricHeight(vec2 uv) {
    float aspect = u_resolution.x / max(1.0, u_resolution.y);
    float phase = u_time * 0.261799;
    vec2 drift = vec2(cos(phase), sin(phase)) * 0.12;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    vec2 cursor = (u_mouse - 0.5) * vec2(aspect, 1.0);
    float influence = exp(-dot(p - cursor, p - cursor) * 14.0) * u_mouseStrength;
    p += (p - cursor) * influence * 0.085;

    vec2 domain = p * 1.8;
    float warpX = fbm(domain * 0.58 + drift + vec2(1.7, 5.2));
    float warpY = fbm(domain * 0.52 - drift + vec2(6.1, 2.3));
    vec2 warped = domain + (vec2(warpX, warpY) - 0.5) * 1.15;
    float broad = fbm(warped * 0.62 + drift * 0.55);
    float fine = fbm(warped * 1.25 - drift * 1.2);
    float band = sin((warped.y * 1.05 + warped.x * 0.32 + (broad - 0.5) * 0.55) * 6.283 + phase * 0.16);
    float fold = 0.5 + 0.5 * band;
    float ridge = smoothstep(0.75, 0.99, fold);
    return broad * 0.16 + fine * 0.03 + fold * 0.66 + ridge * 0.13;
  }

  void main() {
    vec2 stepSize = 1.0 / max(u_resolution, vec2(1.0));
    float height = fabricHeight(v_uv);
    float dx = fabricHeight(v_uv + vec2(stepSize.x, 0.0)) - fabricHeight(v_uv - vec2(stepSize.x, 0.0));
    float dy = fabricHeight(v_uv + vec2(0.0, stepSize.y)) - fabricHeight(v_uv - vec2(0.0, stepSize.y));
    vec3 normal = normalize(vec3(-dx * 82.0, -dy * 82.0, 1.0));

    vec3 night = vec3(0.0784, 0.0431, 0.0275);
    vec3 umber = vec3(0.1412, 0.0784, 0.0471);
    vec3 ember = vec3(0.2902, 0.1412, 0.0706);
    vec3 silk = vec3(0.4157, 0.1961, 0.0941);
    vec3 color = mix(night, umber, smoothstep(0.12, 0.46, height));
    color = mix(color, ember, smoothstep(0.34, 0.68, height) * 0.86);
    color = mix(color, silk, smoothstep(0.58, 0.88, height) * 0.8);

    vec3 lightDirection = normalize(vec3(-0.58, 0.42, 0.70));
    float diffuse = max(dot(normal, lightDirection), 0.0);
    vec3 viewDirection = vec3(0.0, 0.0, 1.0);
    vec3 halfDirection = normalize(lightDirection + viewDirection);
    float anisotropy = 0.25 + 0.75 * abs(normal.y);
    float sheen = pow(max(dot(normal, halfDirection), 0.0), 28.0) * anisotropy;
    float rareRidge = smoothstep(0.88, 0.98, height) * smoothstep(0.48, 0.78, noise(v_uv * vec2(4.0, 7.0) + u_time * 0.025));
    color *= 0.82 + diffuse * 0.18;
    color += vec3(0.24, 0.105, 0.028) * sheen * 0.22;
    color += vec3(1.0, 0.56, 0.16) * rareRidge * 0.075;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
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
  return program;
}

function connectFallbackState(el: HTMLDivElement) {
  let frame = 0;
  const sync = () => {
    frame = 0;
    const hero = document.getElementById("hero");
    const progress = getZoomProgress();
    const fade = Math.max(zoomFade(progress), scrollFade(hero));
    const rect = hero?.getBoundingClientRect();
    const heroAtRest = !!rect && rect.height > 0 && rect.top >= -1 && rect.bottom <= window.innerHeight + 1 && progress < 0.01;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paused = document.visibilityState !== "visible" || heroAtRest || fade <= 0.001 || reduced;
    el.style.setProperty("--bd-fade", fade.toFixed(3));
    el.dataset.paused = String(paused);
    if (!paused) el.style.setProperty("--bd-s", String(window.scrollY / Math.max(1, window.innerHeight)));
  };
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(sync);
  };
  const unsubscribe = subscribeZoom(schedule);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  document.addEventListener("visibilitychange", schedule);
  sync();
  return () => {
    unsubscribe();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    document.removeEventListener("visibilitychange", schedule);
    if (frame) window.cancelAnimationFrame(frame);
  };
}

export function Backdrop() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = root.current;
    const surface = canvas.current;
    if (!el || !surface) return;

    const gl = surface.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
    const program = gl && createProgram(gl);
    if (!gl || !program) {
      el.dataset.webgl = "false";
      return connectFallbackState(el);
    }
    el.dataset.webgl = "true";

    const vertices = gl.createBuffer();
    if (!vertices) {
      el.dataset.webgl = "false";
      gl.deleteProgram(program);
      return connectFallbackState(el);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(program);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0.0784, 0.0431, 0.0275, 1);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolution = gl.getUniformLocation(program, "u_resolution");
    const mouse = gl.getUniformLocation(program, "u_mouse");
    const mouseStrength = gl.getUniformLocation(program, "u_mouseStrength");
    const shaderTime = gl.getUniformLocation(program, "u_time");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const targetMouse = { x: 0.5, y: 0.5 };
    const currentMouse = { x: 0.5, y: 0.5 };
    let mouseActive = false;
    let time = 0;
    let lastTimestamp = 0;
    let animationFrame = 0;
    let updateFrame = 0;
    let paused = true;

    const draw = () => {
      gl.viewport(0, 0, surface.width, surface.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(resolution, surface.width, surface.height);
      gl.uniform2f(mouse, currentMouse.x, currentMouse.y);
      gl.uniform1f(mouseStrength, mouseActive && !reducedMotion.matches ? 1 : 0);
      gl.uniform1f(shaderTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
      surface.width = Math.max(1, Math.round(window.innerWidth * scale));
      surface.height = Math.max(1, Math.round(window.innerHeight * scale));
      draw();
    };

    const stop = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      lastTimestamp = 0;
      draw();
    };

    const frame = (timestamp: number) => {
      animationFrame = 0;
      if (paused || reducedMotion.matches) return;
      const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0.016;
      lastTimestamp = timestamp;
      time += delta;
      const damping = 1 - Math.exp(-delta * 2.5);
      currentMouse.x += (targetMouse.x - currentMouse.x) * damping;
      currentMouse.y += (targetMouse.y - currentMouse.y) * damping;
      draw();
      animationFrame = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (animationFrame || paused || reducedMotion.matches) return;
      draw();
      animationFrame = window.requestAnimationFrame(frame);
    };

    const sync = () => {
      updateFrame = 0;
      const hero = document.getElementById("hero");
      const progress = getZoomProgress();
      const fade = Math.max(zoomFade(progress), scrollFade(hero));
      el.style.setProperty("--bd-fade", fade.toFixed(3));
      const rect = hero?.getBoundingClientRect();
      const heroAtRest = !!rect && rect.height > 0 && rect.top >= -1 && rect.bottom <= window.innerHeight + 1 && progress < 0.01;
      const nextPaused = document.visibilityState !== "visible" || heroAtRest || fade <= 0.001 || reducedMotion.matches;
      el.dataset.paused = String(nextPaused);
      if (!nextPaused) el.style.setProperty("--bd-s", String(window.scrollY / Math.max(1, window.innerHeight)));
      if (paused !== nextPaused || reducedMotion.matches) {
        paused = nextPaused;
        if (paused || reducedMotion.matches) stop();
        else start();
      }
    };
    const scheduleSync = () => {
      if (!updateFrame) updateFrame = window.requestAnimationFrame(sync);
    };
    const onResize = () => {
      resize();
      scheduleSync();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reducedMotion.matches) return;
      targetMouse.x = event.clientX / Math.max(1, window.innerWidth);
      targetMouse.y = 1 - event.clientY / Math.max(1, window.innerHeight);
      mouseActive = true;
    };
    const onPointerLeave = () => {
      mouseActive = false;
      targetMouse.x = 0.5;
      targetMouse.y = 0.5;
    };

    resize();
    sync();
    const unsubscribe = subscribeZoom(scheduleSync);
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", scheduleSync);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    reducedMotion.addEventListener("change", scheduleSync);

    return () => {
      unsubscribe();
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", scheduleSync);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      reducedMotion.removeEventListener("change", scheduleSync);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (updateFrame) window.cancelAnimationFrame(updateFrame);
      gl.deleteBuffer(vertices);
      gl.deleteProgram(program);
    };
  }, [pathname]);

  return (
    <div ref={root} aria-hidden className="backdrop" data-backdrop data-paused="true">
      <canvas ref={canvas} className="backdrop-canvas" />
      <div className="backdrop-fallback" />
      <div className="backdrop-symbols">
        <span className="backdrop-symbol backdrop-centerpiece">
          <SymbolArtwork name="mandala" width={900} height={900} />
        </span>
      </div>
    </div>
  );
}
