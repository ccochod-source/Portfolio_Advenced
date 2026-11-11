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
      className="rounded-full border border-ink/30 px-3 py-1 transition-colors hover:bg-ink hover:text-cream"
    >
      {label}
    </Link>
  );
}
