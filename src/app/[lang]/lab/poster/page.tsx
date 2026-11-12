import { Suspense } from "react";
import { PosterClient } from "./PosterClient";

export default function PosterLab() {
  return (
    <Suspense fallback={null}>
      <PosterClient />
    </Suspense>
  );
}
