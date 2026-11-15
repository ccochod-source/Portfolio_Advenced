import { Footer, HUD_CENTER } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getDictionary, getLocale } from "./dictionaries";
import "./not-found.css";

export default async function NotFound() {
  const [dict, lang] = await Promise.all([getDictionary(), getLocale()]);
  const copy = dict.notFound;
  return (
    <>
      <main
        id="main"
        tabIndex={-1}
        className="lost relative flex min-h-svh flex-col justify-end overflow-hidden pb-24 pt-32 text-cream outline-none md:pb-28"
        data-hud-left={copy.eyebrow}
        data-hud-center={HUD_CENTER}
        data-hud-right="404"
      >
        <div aria-hidden className="lost-sun" />
        <Container className="relative">
          <div aria-hidden className="lost-code">
            <span className="lost-code-glow">404</span>
            <span className="lost-code-outline">404</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <span className="font-mono text-label uppercase text-gold">{copy.code}</span>
          </div>
          <h1 className="mt-6 max-w-3xl text-h1 font-medium">{copy.title}</h1>
          <p className="mt-6 max-w-xl text-lead text-cream-muted">{copy.text}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button href={`/${lang}`} arrow>
              {copy.home}
            </Button>
            <Button href={`/${lang}#projets`} variant="secondary">
              {copy.projects}
            </Button>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
