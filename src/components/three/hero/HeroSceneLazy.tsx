"use client";

import dynamic from "next/dynamic";
import { HeroSceneFallback } from "./HeroSceneFallback";

/** Client-only loader: use this from server components (next/dynamic with ssr:false must live in a client file). */
export const HeroSceneLazy = dynamic(() => import("./HeroScene").then((m) => m.HeroScene), {
  ssr: false,
  loading: () => <HeroSceneFallback />,
});
