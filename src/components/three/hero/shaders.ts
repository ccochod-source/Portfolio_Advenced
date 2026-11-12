export const NOISE_GLSL = /* glsl */ `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }
`;

export const SKY_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Screen-locked quad: ignores the camera so the sky stays still while the scene parallaxes.
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

export const SKY_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uSunPos;
  uniform vec3 uCream;
  uniform vec3 uCreamDeep;
  uniform vec3 uGold;
  uniform vec3 uSun;
  uniform vec3 uCoral;
  varying vec2 vUv;
  ${NOISE_GLSL}

  void main() {
    vec2 uv = vUv;
    vec2 st = vec2(uv.x * uAspect, uv.y);

    // Very slow drifting haze that warps the gradient bands.
    float n = fbm(vec2(st.x * 1.2 + uTime * 0.012, st.y * 1.6 - uTime * 0.009));
    float h = uv.y + (n - 0.5) * 0.16;

    vec3 col = mix(uCoral, uSun, smoothstep(-0.2, 0.2, h));
    col = mix(col, uGold, smoothstep(0.14, 0.42, h));
    col = mix(col, uCreamDeep, smoothstep(0.36, 0.66, h));
    col = mix(col, uCream, smoothstep(0.62, 0.98, h));
    // Golden-hour haze: desaturate the lower half slightly.
    col = mix(col, uCreamDeep, 0.16 * (1.0 - smoothstep(0.0, 0.7, uv.y)));

    // Keep the upper-left quadrant light so dark headline text stays readable.
    float ul = 1.0 - smoothstep(0.0, 1.05 * uAspect, distance(st, vec2(0.0, 1.0)));
    col = mix(col, uCream, ul * 0.75);

    // Sun disc + warm glow near the horizon.
    vec2 p = (uv - uSunPos) * vec2(uAspect, 1.0);
    float d = length(p);
    float pulse = 1.0 + 0.03 * sin(uTime * 0.35);
    float glow = exp(-d * d * 14.0) * 0.55 + exp(-d * 3.2) * 0.45;
    glow *= pulse;
    col += uGold * glow * 0.55 + vec3(1.0, 0.93, 0.8) * glow * 0.3;
    float disc = 1.0 - smoothstep(0.065, 0.085, d);
    col = mix(col, vec3(1.0, 0.97, 0.9), disc * 0.85);

    // Horizon band of gold light.
    float band = exp(-pow((uv.y - uSunPos.y + 0.02) * 5.5, 2.0));
    col = mix(col, uGold, band * 0.22 * (1.0 - uv.y));

    // Soft haze streaks (slow moving).
    float streak = fbm(vec2(st.x * 2.5 - uTime * 0.02, uv.y * 9.0)) - 0.5;
    col += streak * 0.035 * (1.0 - smoothstep(0.1, 0.65, abs(uv.y - uSunPos.y)));

    // Dither to avoid banding.
    col += (hash(gl_FragCoord.xy) - 0.5) * (1.5 / 255.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const PARTICLE_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute float aSpeed;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  uniform float uAspect;
  uniform float uPixelRatio;
  uniform float uHeight;
  uniform float uRange;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec3 p = position;
    float halfRange = uRange * 0.5;
    float y = mod(p.y + uTime * aSpeed + halfRange, uRange) - halfRange;
    p.y = y;
    p.x += sin(uTime * 0.35 * aSpeed + aSeed * 6.2831) * 0.18;
    p.z += cos(uTime * 0.27 + aSeed * 6.2831) * 0.1;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;
    vec2 d = ndc - uMouse;
    d.x *= uAspect;
    float dist = length(d);
    float force = smoothstep(0.55, 0.0, dist) * uMouseStrength;
    vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0, 1.0);
    // Gentle repulsion plus a slight swirl, scaled by depth so it reads the same on screen.
    vec2 swirl = vec2(-dir.y, dir.x) * 0.35;
    mv.xy += (dir + swirl) * force * 0.55 * (-mv.z / 6.0);

    gl_Position = projectionMatrix * mv;
    float edge = 1.0 - smoothstep(halfRange * 0.55, halfRange, abs(y));
    float twinkle = 0.75 + 0.25 * sin(uTime * (1.2 + aSeed) + aSeed * 10.0);
    vAlpha = edge * twinkle;
    vSeed = aSeed;
    gl_PointSize = aSize * uPixelRatio * (uHeight / -mv.z) * 0.02;
  }
`;

export const PARTICLE_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = 1.0 - smoothstep(0.0, 0.22, d);
    float halo = 1.0 - smoothstep(0.1, 0.5, d);
    float a = (core * 0.9 + halo * 0.35) * vAlpha;
    if (a < 0.01) discard;
    vec3 col = mix(uColorA, uColorB, smoothstep(0.3, 0.7, vSeed));
    col = mix(col, vec3(1.0, 0.98, 0.94), core * 0.6);
    gl_FragColor = vec4(col, a);
  }
`;

export const HALO_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Glowing "neural sun": soft core, bright ring with pulsing nodes and faint orbit rings. */
export const HALO_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uGold;
  uniform vec3 uSun;
  uniform vec3 uCream;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float ang = atan(p.y, p.x);

    float core = exp(-r * r * 9.0) * 0.55;
    float ring = exp(-pow((r - 0.58) * 14.0, 2.0));
    float nodes = pow(max(0.0, sin(ang * 9.0 + uTime * 0.6)), 24.0) * ring * 0.9;
    float ring2 = exp(-pow((r - 0.82) * 28.0, 2.0)) * (0.5 + 0.5 * sin(ang * 5.0 - uTime * 0.4)) * 0.35;
    float breathe = 1.0 + 0.06 * sin(uTime * 0.8);
    float g = (core + ring * 0.75 + nodes + ring2) * breathe * uIntensity;
    float fade = 1.0 - smoothstep(0.85, 1.0, r);
    g *= fade;

    vec3 col = mix(uSun, uGold, smoothstep(0.0, 0.7, r));
    col = mix(col, uCream, core * 0.9 + nodes * 0.6);
    gl_FragColor = vec4(col * g, g);
  }
`;
