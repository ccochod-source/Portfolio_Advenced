import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AVATAR_ANCHORS } from "@/lib/avatar/story";
import { ManifestoPin } from "./ManifestoPin";

export type ManifestoProps = {
  copy: Dictionary["manifesto"];
  hud: Dictionary["hud"]["sections"]["manifesto"];
  index?: string;
};

export function Manifesto({ copy, hud, index = "01" }: ManifestoProps) {
  return (
    <ManifestoPin id="manifeste" hud={{ ...hud, center: "CLÉMENT COCHOD — PORTFOLIO", right: `${index} / 05` }}>
      <div data-hud-left={hud.left} data-hud-center="CLÉMENT COCHOD — PORTFOLIO" data-hud-right={`${index} / 05`}>
        <Container className="relative">
          <Eyebrow index={index}>{copy.eyebrow}</Eyebrow>
          {/* Keep a single, untransformed text node: the laptop texture paints this exact headline. */}
          <h2 id="manifesto-headline" className="mt-7 text-[clamp(4.2rem,12.8vw,11.5rem)] leading-[0.9] font-medium tracking-[-0.065em] text-cream">
            {copy.headline}
          </h2>
          <p className="mt-7 max-w-3xl text-[clamp(1.125rem,1.8vw,1.75rem)] leading-[1.45] tracking-[-0.02em] text-cream-muted">
            {copy.intro.split(/\s+/).map((word, i) => (
              <span key={i} data-manifesto-word className="inline-block">{word}{"\u00a0"}</span>
            ))}
          </p>
        </Container>
      </div>

      <div id="manifesto-stage" aria-hidden data-avatar-anchor={AVATAR_ANCHORS.band} className="relative h-[28svh] w-full shrink-0 md:h-[38vh] md:min-h-[260px]" />

      <Container>
        <ol className="divide-y divide-cream/15 border-y border-cream/15">
          {copy.promises.map((promise, i) => (
            <li key={promise.title} data-manifesto-principle className="grid gap-x-5 gap-y-3 py-6 md:grid-cols-[3rem_0.85fr_1fr] md:items-baseline md:py-5">
              <span data-principle-number className="font-mono text-label text-gold">0{i + 1}</span>
              <h3 className="text-[clamp(1.5rem,2.25vw,2.25rem)] leading-[1.05] font-medium tracking-[-0.035em]">{promise.title}</h3>
              <p className="max-w-xl text-sm leading-relaxed text-cream-muted lg:text-base">{promise.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </ManifestoPin>
  );
}
