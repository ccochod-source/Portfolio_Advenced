/** Panel bent on the gallery cylinder (see `lib/gallery/layout.ts`), morphing into a flat full-viewport quad with `uExpand`. */
export const panelVertex = /* glsl */ `
uniform float uOffset;
uniform float uR;
uniform float uW;
uniform float uH;
uniform float uStep;
uniform float uBend;
uniform float uLift;
uniform float uExpand;
uniform vec2 uFull;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec2 local = position.xy * vec2(uW, uH);
  float a = (uOffset * uStep + local.x) / uR;
  vec3 cyl = vec3(uR * sin(a), local.y + uLift, -uR * cos(a));
  // Extra concave bend while moving: the panel edges are pulled toward the camera.
  float e = position.x * 2.0;
  cyl.z += uBend * e * e;
  vec3 flatPos = vec3(position.x * uFull.x, position.y * uFull.y, -uR);
  vec3 p = mix(cyl, flatPos, uExpand);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

export const panelFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uImage;
uniform float uAspect;
uniform float uZoom;
uniform float uVel;
uniform float uRadius;
uniform float uOpacity;
uniform float uDim;
uniform float uGrade;
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  float ia = uImage.x / uImage.y;
  vec2 s = uAspect > ia ? vec2(1.0, ia / uAspect) : vec2(uAspect / ia, 1.0);
  vec2 uv = (vUv - 0.5) * s / uZoom + 0.5;

  // Directional blur + RGB split, both proportional to the carousel velocity.
  float split = uVel * 0.028;
  float blur = abs(uVel) * 0.05;
  vec3 col = vec3(0.0);
  for (int k = 0; k < 9; k++) {
    float o = (float(k) / 8.0 - 0.5) * blur;
    vec2 base = uv + vec2(o, 0.0);
    col.r += texture2D(uMap, base + vec2(split, 0.0)).r;
    col.g += texture2D(uMap, base).g;
    col.b += texture2D(uMap, base - vec2(split, 0.0)).b;
  }
  col /= 9.0;

  // Warm sunset grade + vignette + grain, all faded out once the panel is the full-bleed cover.
  vec3 graded = col * vec3(1.04, 0.9, 0.76);
  float l = dot(graded, vec3(0.299, 0.587, 0.114));
  graded = mix(vec3(l), graded, 0.9) * 0.92;
  vec2 q = vUv - 0.5;
  graded *= 1.0 - dot(q, q) * 0.7;
  graded *= 1.0 - uDim;
  graded += (hash(gl_FragCoord.xy + fract(uTime) * 97.0) - 0.5) * 0.055;
  col = mix(col, graded, uGrade);

  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float d = sdRoundBox(p, vec2(uAspect * 0.5, 0.5), uRadius);
  float aa = max(fwidth(d), 1e-4);
  float alpha = 1.0 - smoothstep(-aa, aa, d);
  gl_FragColor = vec4(col, alpha * uOpacity);
  #include <colorspace_fragment>
}
`;
