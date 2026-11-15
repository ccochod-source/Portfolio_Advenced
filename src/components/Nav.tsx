import Link from "next/link";
import { getDictionary, getLocale } from "@/app/[lang]/dictionaries";
import { LangSwitch } from "./LangSwitch";
import { NavMenu } from "./NavMenu";

export async function Nav() {
  const [dict, lang] = await Promise.all([getDictionary(), getLocale()]);
  const links = [
    { href: `/${lang}#projets`, label: dict.nav.projects },
    { href: `/${lang}#parcours`, label: dict.nav.journey },
    { href: `/${lang}#contact`, label: dict.nav.contact },
  ];

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-4 md:top-5 md:px-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 bg-gradient-to-b from-night/90 via-night/75 to-transparent md:-top-5"
      />
      <nav
        aria-label={dict.nav.aria}
        className="site-nav relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-2"
      >
        <NavMenu links={links} label={dict.nav.menu} closeLabel={dict.nav.close} />
        <Link
          href={`/${lang}`}
          className="flex min-h-11 items-center justify-center whitespace-nowrap font-mono text-label uppercase tracking-[0.14em]"
        >
          CLÉMENT COCHOD
        </Link>
        <div className="flex items-center justify-self-end gap-1 font-mono text-label uppercase sm:gap-3">
          <Link
            href={`/${lang}#contact`}
            className="flex min-h-11 items-center whitespace-nowrap px-1 transition-colors hover:text-gold sm:px-2"
          >
            {dict.nav.contact}
          </Link>
          <LangSwitch label={dict.langSwitch.label} ariaLabel={dict.langSwitch.aria} />
        </div>
      </nav>
    </header>
  );
}
