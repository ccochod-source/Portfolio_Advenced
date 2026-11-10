import { LangSwitch } from "@/components/LangSwitch";
import { getDictionary } from "./dictionaries";

export default async function Home() {
  const dict = await getDictionary();

  return (
    <main className="golden-hour relative flex min-h-svh flex-col justify-between overflow-hidden px-6 py-6 md:px-12 md:py-10">
      <header className="flex items-center justify-between font-mono text-xs uppercase tracking-widest">
        <span>Clément Cochod</span>
        <LangSwitch label={dict.langSwitch.label} ariaLabel={dict.langSwitch.aria} />
      </header>

      <section className="max-w-5xl">
        <p className="mb-6 font-mono text-xs uppercase tracking-widest opacity-80">
          {dict.hero.eyebrow}
        </p>
        <h1 className="text-5xl font-medium leading-[0.95] tracking-tight md:text-8xl">
          {dict.hero.title}
        </h1>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs uppercase tracking-widest">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-ink" aria-hidden />
          {dict.hero.status}
        </span>
        <span className="opacity-70">{dict.hero.wip}</span>
      </footer>
    </main>
  );
}
