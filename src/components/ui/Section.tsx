import type { ReactNode } from "react";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";

type SectionProps = {
  id?: string;
  index?: string;
  eyebrow?: string;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function Section({ id, index, eyebrow, title, children, className = "" }: SectionProps) {
  return (
    <section id={id} className={`py-24 md:py-36 ${className}`}>
      <Container>
        {eyebrow && <Eyebrow index={index}>{eyebrow}</Eyebrow>}
        {title && <h2 className="mt-6 max-w-5xl text-h2 font-medium">{title}</h2>}
        {children && <div className={title || eyebrow ? "mt-14 md:mt-20" : ""}>{children}</div>}
      </Container>
    </section>
  );
}
