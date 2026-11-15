import Link from "next/link";
import { Magnetic, Reveal, TextReveal } from "@/components/motion";
import { CaseLabel } from "./CaseLabel";
import { ParallaxFigure } from "./ParallaxFigure";
import { splitFigures, splitLead, type CaseImage } from "./order";

type Hud = Record<`data-hud-${string}`, string>;
const gutter = "mx-auto w-full max-w-[1680px] px-5 md:px-10";

export type MetaItem = { label: string; value: string | string[] };

export function CaseOverview({ hud, label, meta, summary, context, roleLabel, role, skillsLabel, skills, skillsHref }: {
  hud: Hud;
  label: string;
  meta: MetaItem[];
  summary: string;
  context: string;
  roleLabel: string;
  role: string;
  skillsLabel: string;
  skills: string[];
  skillsHref: string;
}) {
  return (
    <section {...hud} aria-labelledby="case-overview" className={`${gutter} relative pb-28 pt-24 md:pb-44 md:pt-36`}>
      <CaseLabel id="case-overview" index="01">
        {label}
      </CaseLabel>
      <div className="mt-12 grid gap-16 md:mt-20 lg:grid-cols-12 lg:gap-10">
        <Reveal as="div" stagger y={18} className="lg:col-span-5">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-2 lg:pr-12">
            {meta.map((item) => (
              <div key={item.label} className={Array.isArray(item.value) ? "col-span-2 sm:col-span-3 lg:col-span-2" : ""}>
                <dt className="font-mono text-label uppercase text-cream-dim">{item.label}</dt>
                <dd className="mt-3 text-sm font-medium uppercase leading-relaxed tracking-[0.06em] text-cream">
                  {Array.isArray(item.value) ? (
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                      {item.value.map((value) => (
                        <li key={value}>{value}</li>
                      ))}
                    </ul>
                  ) : (
                    item.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <div className="lg:col-span-7">
          <TextReveal as="p" className="case-statement text-cream">
            {summary}
          </TextReveal>
          <TextReveal as="p" className="mt-10 max-w-3xl text-lead text-cream-muted md:mt-14">
            {context}
          </TextReveal>
          <Reveal as="div" className="mt-14 grid gap-4 border-t border-cream/15 pt-8 md:mt-20 md:grid-cols-[10rem_1fr] md:gap-8">
            <h3 className="font-mono text-label uppercase text-cream-dim">{roleLabel}</h3>
            <div>
              <p className="max-w-3xl text-lg leading-relaxed text-cream-muted">{role}</p>
              {skills.length > 0 && (
                <ul aria-label={skillsLabel} className="mt-6 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <li key={skill}>
                      <Link
                        href={skillsHref}
                        className="touch-target inline-flex min-h-9 items-center rounded-full border border-cream/20 px-4 font-mono text-label uppercase text-cream-muted transition-colors duration-300 hover:border-sun hover:text-cream"
                      >
                        {skill}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function CaseApproach({ hud, label, steps }: { hud: Hud; label: string; steps: string[] }) {
  return (
    <section {...hud} aria-labelledby="case-approach" className={`${gutter} relative py-24 md:py-36`}>
      <CaseLabel id="case-approach" index="02">
        {label}
      </CaseLabel>
      <ol className="mt-12 border-b border-cream/15 md:mt-20">
        {steps.map((step, i) => {
          const [lead, rest] = splitLead(step);
          return (
            <Reveal as="li" key={i} y={48} className="grid gap-4 border-t border-cream/15 py-10 md:grid-cols-12 md:gap-10 md:py-14">
              <span aria-hidden className="case-step-index md:col-span-3 lg:col-span-4">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="md:col-span-9 lg:col-span-8">
                {lead && <h3 className="text-h3 font-medium text-cream">{lead}</h3>}
                <p className={`max-w-3xl ${lead ? "mt-4 text-lead text-cream-muted" : "text-h3 font-medium text-cream"}`}>{rest}</p>
              </div>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}

export function CaseResults({ hud, label, results }: { hud: Hud; label: string; results: string[] }) {
  return (
    <section {...hud} aria-labelledby="case-results" className={`${gutter} relative py-24 md:py-36`}>
      <CaseLabel id="case-results" index="03">
        {label}
      </CaseLabel>
      <Reveal as="ul" stagger={0.1} y={40} className="mt-12 md:mt-20">
        {results.map((result, i) => (
          <li key={i} className="grid gap-3 border-t border-cream/15 py-8 md:grid-cols-12 md:gap-10 md:py-10">
            <span aria-hidden className="font-mono text-label text-cream-dim tabular-nums md:col-span-1 md:pt-3">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="case-result md:col-span-11">
              {splitFigures(result).map((part, j) =>
                j % 2 === 1 ? (
                  <span key={j} className="text-gold">
                    {part}
                  </span>
                ) : (
                  part
                ),
              )}
            </p>
          </li>
        ))}
      </Reveal>
    </section>
  );
}

const LAYOUTS = ["full", "right", "left"] as const;

export function CaseGallery({ hud, label, figureLabel, images }: { hud: Hud; label: string; figureLabel: string; images: CaseImage[] }) {
  if (images.length === 0) return null;
  return (
    <section {...hud} aria-labelledby="case-gallery" className="relative py-24 md:py-36">
      <div className={gutter}>
        <CaseLabel id="case-gallery" index="04">
          {label}
        </CaseLabel>
      </div>
      <div className="mt-12 flex flex-col gap-16 px-3 md:mt-20 md:gap-28 md:px-7">
        {images.map((image, i) => (
          <ParallaxFigure
            key={image.src}
            image={image}
            label={`${figureLabel} ${String(i + 1).padStart(2, "0")}`}
            layout={LAYOUTS[i % LAYOUTS.length]}
          />
        ))}
      </div>
    </section>
  );
}

export type CaseLink = { href: string; label: string; external: boolean };

export function CaseLinks({ hud, label, links, newTab }: { hud: Hud; label: string; links: CaseLink[]; newTab: string }) {
  return (
    <section {...hud} aria-labelledby="case-links" className={`${gutter} relative py-24 md:py-32`}>
      <CaseLabel id="case-links" index="05">
        {label}
      </CaseLabel>
      <ul className="mt-12 flex flex-wrap gap-4 md:mt-16 md:gap-6">
        {links.map((link, i) => (
          <li key={link.href}>
            <Magnetic strength={0.28}>
              <a
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className={`case-pill group ${i === 0 ? "case-pill--solid" : ""}`}
              >
                <span>{link.label}</span>
                {link.external && <span className="sr-only"> {newTab}</span>}
                <span aria-hidden className="case-pill-arrow">
                  {link.external ? "↗" : "→"}
                </span>
              </a>
            </Magnetic>
          </li>
        ))}
      </ul>
    </section>
  );
}
