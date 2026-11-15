"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasLocale, locales } from "@/i18n";

export function LangSwitch({ label, ariaLabel }: { label: string; ariaLabel: string }) {
  const pathname = usePathname();
  const [, current, ...rest] = pathname.split("/");
  const target = locales.find((l) => l !== (hasLocale(current) ? current : undefined)) ?? locales[0];
  const href = `/${[target, ...rest].filter(Boolean).join("/")}`;

  return (
    <Link
      href={href}
      aria-label={`${label} — ${ariaLabel}`}
      hrefLang={target}
      className="flex min-h-11 min-w-11 items-center justify-center border border-cream/35 px-2 font-mono text-label uppercase tracking-[0.14em] text-cream transition-colors hover:border-gold hover:text-gold"
    >
      {label}
    </Link>
  );
}
