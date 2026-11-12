"use client";

import dynamic from "next/dynamic";
import type { HeroSceneProps } from "./HeroScene";
import { HeroSceneFallback } from "./HeroSceneFallback";
import { useAfterLoad } from "../useAfterLoad";

const HeroSceneDynamic = dynamic(() => import("./HeroScene").then((m) => m.HeroScene), {
  ssr: false,
  loading: () => <HeroSceneFallback />,
});

/** Client-only loader (next/dynamic with ssr:false must live in a client file); the chunk is fetched after first paint. */
export function HeroSceneLazy(props: HeroSceneProps) {
  const ready = useAfterLoad();
  return ready ? <HeroSceneDynamic {...props} /> : <HeroSceneFallback className={props.className} />;
}
