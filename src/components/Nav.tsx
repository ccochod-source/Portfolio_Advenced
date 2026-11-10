import Link from "next/link";
import { getDictionary, getLocale } from "@/app/[lang]/dictionaries";
import { LangSwitch } from "./LangSwitch";

export async function Nav() {
  const [dict, lang] = await Promise.all([getDictionary(), getLocale()]);
  const links = [
    { href: `/${lang}#projets`, label: dict.nav.projects },
    { href: `/${lang}#parcours`, label: dict.nav.journey },
    { href: `/${lang}#contact`, label: dict.nav.contact },
  ];

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        aria-label={dict.nav.aria}
        className="flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border border-ink/10 bg-cream/75 py-2 pl-4 pr-2 shadow-[0_8px_30px_-12px_rgba(43,26,18,0.25)] backdrop-blur-md"
      >
        <Link href={`/${lang}`} className="whitespace-nowrap font-medium tracking-tight">
          Clément Cochod
        </Link>
        <ul className="hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="opacity-70 transition-opacity hover:opacity-100">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 font-mono text-label uppercase">
          <LangSwitch label={dict.langSwitch.label} ariaLabel={dict.langSwitch.aria} />
          <Link
            href={`/${lang}#contact`}
            className="whitespace-nowrap rounded-full bg-ink px-3 py-2 text-cream transition-colors hover:bg-sun sm:px-4"
          >
            {dict.nav.cta}
          </Link>
        </div>
      </nav>
    </header>
  );
}
