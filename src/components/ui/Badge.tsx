import type { ReactNode } from "react";

type Tone = "gold" | "outline" | "dark";

const tones: Record<Tone, string> = {
  gold: "bg-gold text-ink",
  outline: "border border-cream/25 text-cream-dim",
  dark: "bg-umber text-cream",
};

export function Badge({ children, tone = "outline", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 badge rounded-full px-3 py-1 font-mono text-label uppercase tracking-wider ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
