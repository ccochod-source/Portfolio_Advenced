import type { ElementType, ReactNode } from "react";

type EyebrowProps = {
  index?: string;
  children: ReactNode;
  className?: string;
  /** `h2`/`h3` when the eyebrow is the heading of its section (keeps the mono label look). */
  as?: ElementType;
  id?: string;
};

export function Eyebrow({ index, children, className = "", as: Tag = "p", id }: EyebrowProps) {
  return (
    <Tag id={id} className={`flex items-center gap-3 font-mono text-label uppercase ${className}`}>
      {index && <span className="text-sun-deep">{index}</span>}
      {index && <span aria-hidden className="h-px w-8 bg-current opacity-40" />}
      <span>{children}</span>
    </Tag>
  );
}
