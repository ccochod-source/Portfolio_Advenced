"use client";

import { useEffect } from "react";
import { resetHud, setHud } from "@/lib/hud/store";

export function CaseHud({ left, center, right }: { left: string; center: string; right: string }) {
  useEffect(() => {
    setHud({ left, center, right });
    return () => resetHud();
  }, [left, center, right]);
  return null;
}
