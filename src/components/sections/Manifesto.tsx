import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

export type ManifestoProps = { copy: Dictionary["manifesto"]; index?: string };

export function Manifesto({ copy, index = "01" }: ManifestoProps) {
  return (
    <section id="manifeste" className="relative overflow-hidden py-24 md:py-36">
      <Container>
        <Eyebrow index={index}>{copy.eyebrow}</Eyebrow>
        <h2 id="manifesto-headline" className="mt-8 text-display font-medium">
          {copy.headline}
        </h2>
        <p className="mt-10 max-w-2xl text-lead text-ink-soft">{copy.intro}</p>
      </Container>

      <div id="manifesto-stage" aria-hidden className="relative mt-10 h-[32vh] min-h-56 w-full md:mt-16 md:h-[45vh]" />

      <Container>
        <ol className="grid gap-x-10 gap-y-12 border-t border-ink/10 pt-12 md:grid-cols-2 xl:grid-cols-4">
          {copy.promises.map((promise, i) => (
            <li key={promise.title}>
              <span className="font-mono text-label text-sun">0{i + 1}</span>
              <h3 className="mt-4 text-h3 font-medium">{promise.title}</h3>
              <p className="mt-4 text-ink-soft">{promise.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
