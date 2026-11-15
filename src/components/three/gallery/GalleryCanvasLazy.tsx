"use client";

import dynamic from "next/dynamic";

export const GalleryCanvasLazy = dynamic(() => import("./GalleryCanvas").then((m) => m.GalleryCanvas), {
  ssr: false,
  loading: () => null,
});
