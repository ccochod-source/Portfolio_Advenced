import { MathUtils } from "three";
import { SCREEN_SIZE } from "./desk";

/**
 * How the laptop screen covers the viewport at the end of the zoom (progress 1).
 * The screen and the viewport rarely share an aspect ratio, so the screen *covers* the viewport:
 * the tighter dimension matches the viewport edges exactly, the other one overflows.
 */
export type ScreenFraming = {
  /** Camera distance from the screen centre (along its normal) at progress 1. */
  distance: number;
  /** Part of the screen (UV space, v up) that is visible at progress 1. */
  visible: { u0: number; v0: number; u1: number; v1: number };
};

export function screenFraming(viewportAspect: number, fovDeg: number): ScreenFraming {
  const { width, height } = SCREEN_SIZE;
  const screenAspect = width / height;
  const tanHalf = Math.tan(MathUtils.degToRad(fovDeg / 2));
  if (viewportAspect >= screenAspect) {
    // Wider viewport: the screen width spans the viewport width, the top/bottom of the screen overflow.
    const visibleV = screenAspect / viewportAspect;
    return {
      distance: width / 2 / (tanHalf * viewportAspect),
      visible: { u0: 0, u1: 1, v0: 0.5 - visibleV / 2, v1: 0.5 + visibleV / 2 },
    };
  }
  const visibleU = viewportAspect / screenAspect;
  return {
    distance: height / 2 / tanHalf,
    visible: { u0: 0.5 - visibleU / 2, u1: 0.5 + visibleU / 2, v0: 0, v1: 1 },
  };
}
