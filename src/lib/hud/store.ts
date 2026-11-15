"use client";

import { useSyncExternalStore } from "react";

export type HudState = { left: string; center: string; right: string };

const EMPTY: HudState = { left: "", center: "", right: "" };
let state: HudState = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function setHud(partial: Partial<HudState>) {
  state = { ...state, ...partial };
  emit();
}

export function resetHud() {
  state = EMPTY;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHud() {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}
