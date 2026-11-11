"use client";

import dynamic from "next/dynamic";
import { AvatarFallback } from "./Avatar";

export const AvatarStageLazy = dynamic(() => import("./Avatar").then((m) => m.AvatarStage), {
  ssr: false,
  loading: () => <AvatarFallback />,
});
