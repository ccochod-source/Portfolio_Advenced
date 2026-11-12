import type { Vector2 } from "three";

/** Normalised pointer position (-1..1) shared by the camera parallax and the cloud layers; `strength` fades it in/out. */
export type MouseState = { target: Vector2; current: Vector2; strength: number; targetStrength: number };
