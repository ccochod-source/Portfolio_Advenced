/** Pure CSS golden-hour sky (gradient + static soft clouds) used while the WebGL scene loads or when WebGL is unavailable. */
export function HeroSceneFallback({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{
        backgroundImage: [
          "url(/textures/cloud-2.webp)",
          "url(/textures/cloud-1.webp)",
          "url(/textures/cloud-3.webp)",
          "radial-gradient(36% 30% at 72% 62%, rgba(255,248,238,0.95) 0%, rgba(255,193,69,0.55) 35%, rgba(255,122,26,0) 75%)",
          "linear-gradient(180deg, #ffe9c9 0%, #ffd58a 30%, #ffb14a 55%, #ff8a3a 78%, #ff6a52 100%)",
        ].join(","),
        backgroundSize: "70% auto, 55% auto, 90% auto, 100% 100%, 100% 100%",
        backgroundPosition: "-10% 18%, 70% 40%, 40% 100%, center, center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
