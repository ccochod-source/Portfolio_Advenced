import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getDictionary } from "./dictionaries";

export default async function Home() {
  const dict = await getDictionary();

  return (
    <>
      <main className="golden-hour flex min-h-svh flex-col justify-end pb-10 pt-32">
        <Container>
          <Eyebrow className="mb-6 opacity-80">{dict.hero.eyebrow}</Eyebrow>
          <h1 className="max-w-6xl text-h1 font-medium">{dict.hero.title}</h1>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 font-mono text-label uppercase">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-ink" aria-hidden />
              {dict.hero.status}
            </span>
            <span className="opacity-70">{dict.hero.wip}</span>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
