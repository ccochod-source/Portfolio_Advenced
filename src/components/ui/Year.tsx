"use client";

import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};
const BUILD_YEAR = 2026;

/** Current year on the client; the build year in static HTML (prerender cannot read the clock). */
export function Year() {
  const year = useSyncExternalStore(
    subscribeNoop,
    () => new Date().getFullYear(),
    () => BUILD_YEAR,
  );
  return <>{year}</>;
}
