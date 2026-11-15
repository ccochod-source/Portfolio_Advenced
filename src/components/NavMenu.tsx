"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

type NavLink = { href: string; label: string };

/** Compact disclosure menu for the section anchors below `md`; the same links are inline on larger screens. */
export function NavMenu({ links, label, closeLabel }: { links: NavLink[]; label: string; closeLabel: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? closeLabel : label}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 items-center gap-2 px-1 font-mono text-label uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-75"
      >
        <span aria-hidden className="relative block h-3 w-5">
          <span className={`absolute left-0 top-0 h-0.5 w-full rounded bg-current transition-transform duration-300 ${open ? "translate-y-[5px] rotate-45" : ""}`} />
          <span className={`absolute left-0 top-[5px] h-0.5 w-full rounded bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 top-[10px] h-0.5 w-full rounded bg-current transition-transform duration-300 ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
        </span>
        <span>{label}</span>
      </button>
      <ul
        id={id}
        hidden={!open}
        className="absolute left-0 top-[calc(100%+0.5rem)] m-0 flex w-[min(90vw,22rem)] list-none flex-col gap-1 border border-cream/15 bg-night/95 p-2 text-cream shadow-[0_16px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-lg"
      >
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center px-4 font-mono text-label uppercase tracking-[0.12em] transition-[color,background-color] hover:bg-cream/10 hover:text-gold"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
