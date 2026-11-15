import type { HTMLAttributes } from "react";

export function Container({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`mx-auto w-full max-w-[1440px] px-6 md:px-12 ${className}`}>
      {children}
    </div>
  );
}
