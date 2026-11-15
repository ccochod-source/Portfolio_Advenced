/**
 * Geometry of the curved gallery: the camera looks at the inside of a vertical cylinder (radius `R`, axis = y,
 * centre at the origin) from `camZ` behind its axis; panel `i` is bent on the wall at arc offset
 * `(i - display) * step`. Shared by the vertex shader (see `three/gallery/shaders.ts`) and the DOM hit test.
 */
export type GalleryLayout = {
  R: number;
  camZ: number;
  fov: number;
  aspect: number;
  /** Panel size in world units (arc length × height). */
  W: number;
  H: number;
  /** Arc distance between two panel centres. */
  step: number;
  /** Corner radius, in fractions of the panel height. */
  radius: number;
  /** Screen fraction (0 → 1 of the width) covered by the centred panel. */
  widthFraction: number;
  heightFraction: number;
};

const R = 6;
const CAM_Z = 4;
const FOV = 32;

const tanHalf = Math.tan((FOV * Math.PI) / 360);

function projectedWidth(W: number, aspect: number) {
  const a = W / 2 / R;
  return (R * Math.sin(a)) / (CAM_Z + R * Math.cos(a)) / (tanHalf * aspect);
}

export function computeLayout(aspect: number): GalleryLayout {
  const target = aspect >= 1.3 ? 0.56 : aspect >= 0.95 ? 0.66 : 0.8;
  let lo = 0.2;
  let hi = R * 2.4;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (projectedWidth(mid, aspect) < target) lo = mid;
    else hi = mid;
  }
  const W = lo;
  const depth = CAM_Z + R;
  const maxH = 1.24 * depth * tanHalf;
  const H = Math.min(W / (aspect >= 1 ? 1.5 : 1.2), maxH);
  return {
    R,
    camZ: CAM_Z,
    fov: FOV,
    aspect,
    W,
    H,
    step: W * 1.075,
    radius: 0.035,
    widthFraction: projectedWidth(W, aspect),
    heightFraction: H / (2 * depth * tanHalf),
  };
}

/** Project index under a pointer given in NDC (-1 → 1, y up), or -1. */
export function hitTest(layout: GalleryLayout, x: number, y: number, display: number, count: number): number {
  const dx = x * tanHalf * layout.aspect;
  const dy = y * tanHalf;
  const dz = -1;
  const a = dx * dx + dz * dz;
  const b = 2 * layout.camZ * dz;
  const c = layout.camZ * layout.camZ - layout.R * layout.R;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return -1;
  const s = (-b + Math.sqrt(disc)) / (2 * a);
  const px = s * dx;
  const pz = layout.camZ + s * dz;
  const py = s * dy;
  const angle = Math.atan2(px, -pz);
  const k = display + (angle * layout.R) / layout.step;
  const i = Math.round(k);
  if (i < 0 || i >= count) return -1;
  const local = (k - i) * layout.step;
  if (Math.abs(local) > layout.W / 2 || Math.abs(py) > layout.H / 2) return -1;
  return i;
}
