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
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? closeLabel : label}
        onClick={() => setOpen((o) => !o)}
        className="flex size-11 items-center justify-center rounded-full text-ink transition-[color,background-color] hover:bg-ink/10"
      >
        <span aria-hidden className="relative block h-3 w-5">
          <span className={`absolute left-0 top-0 h-0.5 w-full rounded bg-current transition-transform duration-300 ${open ? "translate-y-[5px] rotate-45" : ""}`} />
          <span className={`absolute left-0 top-[5px] h-0.5 w-full rounded bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 top-[10px] h-0.5 w-full rounded bg-current transition-transform duration-300 ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
        </span>
      </button>
      <ul
        id={id}
        hidden={!open}
        className="absolute inset-x-0 top-[calc(100%+0.5rem)] m-0 flex list-none flex-col gap-1 rounded-3xl border border-ink/10 bg-cream/95 p-2 shadow-[0_8px_30px_-12px_rgba(43,26,18,0.25)] backdrop-blur-md"
      >
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-2xl px-4 text-base font-medium transition-[color,background-color] hover:bg-ink hover:text-cream"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
