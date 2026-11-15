"use client";

import { useEffect } from "react";
import { setHud, useHud } from "@/lib/hud/store";

/** Page-level HUD default: whenever no section marker owns the HUD, it shows the project. */
export function CaseHud({ left, center, right }: { left: string; center: string; right: string }) {
  const hud = useHud();
  const empty = !hud.left && !hud.center && !hud.right;

  useEffect(() => {
    if (empty) setHud({ left, center, right });
  }, [empty, left, center, right]);

  return null;
}
