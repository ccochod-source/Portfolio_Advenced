import Link from "next/link";
import { Badge } from "./Badge";

export type ProjectCardProps = {
  href: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  award?: string;
  tags?: string[];
};

export function ProjectCard({ href, title, category, year, summary, award, tags = [] }: ProjectCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="sunset-card relative aspect-[4/3] overflow-hidden rounded-[1.75rem]">
        <div className="absolute inset-0 flex items-end p-6 transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]">
          <span className="text-h2 font-medium text-cream/90">{title}</span>
        </div>
        {award && (
          <Badge tone="gold" className="absolute left-5 top-5">
            ★ {award}
          </Badge>
        )}
      </div>
      <div className="mt-5 flex items-start justify-between gap-6">
        <div>
          <h3 className="text-h3 font-medium">{title}</h3>
          <p className="mt-1 font-mono text-label uppercase text-ink-soft">{category}</p>
        </div>
        <span className="font-mono text-label text-ink-soft">{year}</span>
      </div>
      <p className="mt-3 max-w-xl text-ink-soft">{summary}</p>
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}
    </Link>
  );
}
