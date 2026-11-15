import Image from "next/image";
import Link from "next/link";
import { Badge } from "./Badge";

export type ProjectCardImage = { src: string; alt: string; width: number; height: number };

export type ProjectCardProps = {
  href: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  award?: string;
  tags?: string[];
  image?: ProjectCardImage;
  /** Compact variant for dense grids (smaller title, two-line summary). */
  compact?: boolean;
  className?: string;
};

export function ProjectCard({ href, title, category, year, summary, award, tags = [], image, compact = false, className = "" }: ProjectCardProps) {
  return (
    <Link href={href} className={`group block ${className}`}>
      <div className="sunset-card relative aspect-[4/3] overflow-hidden rounded-[1.75rem]">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 768px) calc(100vw - 2rem), (max-width: 1280px) 45vw, 400px"
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-end p-6 transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]">
            <span className="text-h2 font-medium text-cream">{title}</span>
          </div>
        )}
        {award && (
          <Badge tone="gold" className="absolute left-5 top-5">
            ★ {award}
          </Badge>
        )}
      </div>
      <div className="mt-5 flex items-start justify-between gap-6">
        <div>
          <h3 className={compact ? "text-xl font-medium tracking-tight" : "text-h3 font-medium"}>{title}</h3>
          <p className="mt-1 font-mono text-label uppercase text-cream-dim">{category}</p>
        </div>
        <span className="font-mono text-label text-cream-dim">{year}</span>
      </div>
      <p className={compact ? "mt-3 line-clamp-2 text-sm text-cream-muted" : "mt-3 max-w-xl text-cream-muted"}>{summary}</p>
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
