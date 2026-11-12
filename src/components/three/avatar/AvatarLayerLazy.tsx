"use client";

import dynamic from "next/dynamic";
import { useAfterLoad } from "../useAfterLoad";

const AvatarLayerDynamic = dynamic(() => import("./AvatarLayer").then((m) => m.AvatarLayer), {
  ssr: false,
  loading: () => null,
});

/** Single fixed avatar canvas, loaded (with its GLB preload) once the page is idle after first paint. */
export function AvatarLayerLazy() {
  const ready = useAfterLoad();
  return ready ? <AvatarLayerDynamic /> : null;
}
