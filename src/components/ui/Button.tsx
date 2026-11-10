import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "light" | "outlineLight" | "link";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-cream hover:bg-sun",
  secondary: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-cream",
  light: "bg-cream text-ink hover:bg-gold",
  outlineLight: "border border-cream/30 text-cream hover:bg-cream hover:text-ink",
  link: "text-ink underline-offset-4 hover:underline px-0! py-0!",
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
  const classes = `group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors duration-300 ${variants[variant]} ${className}`;
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
