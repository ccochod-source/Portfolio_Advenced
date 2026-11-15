import type { ReactNode } from "react";

/** Small mono section heading: "02 —— APPROCHE". */
export function CaseLabel({ index, children, id, className = "" }: { index: string; children: ReactNode; id?: string; className?: string }) {
  return (
    <h2 id={id} className={`flex items-center gap-4 font-mono text-label uppercase text-cream-dim ${className}`}>
      <span className="text-sun">{index}</span>
      <span aria-hidden className="h-px w-10 bg-current opacity-50" />
      <span>{children}</span>
    </h2>
  );
}
