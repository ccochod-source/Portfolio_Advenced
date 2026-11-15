import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "light" | "outlineLight" | "link";

const variants: Record<Variant, string> = {
  primary: "button-primary bg-silk text-cream hover:bg-ember",
  secondary: "button-secondary border border-cream/30 text-cream-muted hover:border-cream/60 hover:bg-cream/10 hover:text-cream",
  light: "bg-cream text-night hover:bg-gold",
  outlineLight: "border border-cream/30 text-cream hover:bg-cream hover:text-night",
  link: "text-cream-muted underline underline-offset-4 decoration-cream/30 hover:decoration-current px-0! py-0! touch-target",
};

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  arrow?: boolean;
  className?: string;
  download?: boolean;
};

export function Button({ href, children, variant = "primary", arrow = false, className = "", download }: ButtonProps) {
  const classes = `group inline-flex items-center gap-2 rounded-full px-5 py-3 min-h-11 text-sm font-medium transition-[color,background-color,border-color] duration-300 ${variants[variant]} ${className}`;
  const content = (
    <>
      <span>{children}</span>
      {arrow && (
        <span aria-hidden className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1">
          →
        </span>
      )}
    </>
  );

  const isInternal = href.startsWith("/") && !download;
  if (isInternal) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={classes}
      download={download}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {content}
    </a>
  );
}
