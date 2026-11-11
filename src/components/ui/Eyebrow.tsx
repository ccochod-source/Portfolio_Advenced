import type { ReactNode } from "react";

export function Eyebrow({ index, children, className = "" }: { index?: string; children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-3 font-mono text-label uppercase ${className}`}>
      {index && <span className="text-sun-deep">{index}</span>}
      {index && <span aria-hidden className="h-px w-8 bg-current opacity-40" />}
      <span>{children}</span>
    </p>
  );
}
