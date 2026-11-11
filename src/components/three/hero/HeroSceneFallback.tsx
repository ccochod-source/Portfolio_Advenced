/** Pure CSS golden-hour gradient used while the WebGL scene loads or when WebGL is unavailable. */
export function HeroSceneFallback({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{
        background: [
          "radial-gradient(28% 28% at 68% 70%, rgba(255,244,230,0.95) 0%, rgba(255,193,69,0.7) 25%, rgba(255,122,26,0) 70%)",
          "radial-gradient(70% 60% at 0% 0%, #fff4e6 0%, rgba(255,244,230,0) 70%)",
          "linear-gradient(180deg, #fff4e6 0%, #ffe4c4 38%, #ffc145 62%, #ff7a1a 84%, #ff5a4e 100%)",
        ].join(","),
      }}
    />
  );
}
