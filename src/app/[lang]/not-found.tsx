import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getDictionary, getLocale } from "./dictionaries";

export default async function NotFound() {
  const [dict, lang] = await Promise.all([getDictionary(), getLocale()]);
  const copy = dict.notFound;
  return (
    <>
      <main id="main" tabIndex={-1} className="page-not-found flex min-h-svh flex-col justify-end pb-16 pt-32 text-cream outline-none md:pb-24">
        <Container>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h1 className="mt-6 max-w-3xl text-h1 font-medium">{copy.title}</h1>
          <p className="mt-8 max-w-xl text-lead text-cream-muted">{copy.text}</p>
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
