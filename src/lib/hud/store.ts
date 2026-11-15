"use client";

import { useSyncExternalStore } from "react";

export type HudSlots = {
  left?: string;
  center?: string;
  right?: string;
};

export type HudState = Required<HudSlots>;

const EMPTY_HUD: HudState = { left: "", center: "", right: "" };
let state = EMPTY_HUD;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return EMPTY_HUD;
}

export function setHud(partial: HudSlots) {
  const next = {
    left: partial.left ?? state.left,
    center: partial.center ?? state.center,
    right: partial.right ?? state.right,
  };
  if (next.left === state.left && next.center === state.center && next.right === state.right) return;
  state = next;
  listeners.forEach((listener) => listener());
}

export function useHud() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function resetHud() {
  if (state === EMPTY_HUD) return;
  state = EMPTY_HUD;
  listeners.forEach((listener) => listener());
}
