/** Static sky photo used while the WebGL scene loads or when WebGL is unavailable. */
export function HeroSceneFallback({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <picture className="absolute inset-0 block">
        <source media="(max-aspect-ratio: 1/1)" srcSet="/textures/hero-sky-portrait.webp" />
        <img
          src="/textures/hero-sky.webp"
          alt=""
          width={3168}
          height={1344}
          fetchPriority="high"
          className="size-full object-cover object-[40%_50%]"
        />
      </picture>
    </div>
  );
}
